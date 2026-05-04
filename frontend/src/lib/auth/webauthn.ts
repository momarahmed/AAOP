import { api, unwrapError } from '@/lib/api/client';

/**
 * Client-side WebAuthn helpers (Phase 4-5).
 *
 * The server returns options pre-shaped for `navigator.credentials.create()` /
 * `.get()` — challenges and IDs are base64url strings that we convert to
 * `BufferSource` here. After the authenticator returns a credential, we
 * serialise the response back to JSON the server expects.
 */

function b64uToArr(b64u: string): ArrayBuffer {
  const pad = '='.repeat((4 - (b64u.length % 4)) % 4);
  const b64 = (b64u + pad).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const out = new ArrayBuffer(raw.length);
  const view = new Uint8Array(out);
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
  return out;
}

function arrToB64u(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

interface CreationOptions {
  challenge: string;
  rp: { id: string; name: string };
  user: { id: string; name: string; displayName: string };
  pubKeyCredParams: Array<{ type: 'public-key'; alg: number }>;
  timeout?: number;
  excludeCredentials?: Array<{ id: string; type: 'public-key' }>;
  authenticatorSelection?: { userVerification?: AuthenticatorSelectionCriteria['userVerification'] };
}

interface RequestOptions {
  challenge: string;
  rpId?: string;
  allowCredentials?: Array<{ id: string; type: 'public-key' }>;
  timeout?: number;
  userVerification?: AuthenticatorSelectionCriteria['userVerification'];
}

function decodeCreate(opts: CreationOptions): PublicKeyCredentialCreationOptions {
  return {
    challenge: b64uToArr(opts.challenge),
    rp:        { id: opts.rp.id, name: opts.rp.name },
    user: {
      id: b64uToArr(opts.user.id),
      name: opts.user.name,
      displayName: opts.user.displayName,
    },
    pubKeyCredParams: opts.pubKeyCredParams,
    timeout: opts.timeout,
    excludeCredentials: (opts.excludeCredentials ?? []).map((c) => ({
      id: b64uToArr(c.id),
      type: 'public-key',
    })),
    authenticatorSelection: opts.authenticatorSelection,
    attestation: 'none',
  };
}

function decodeGet(opts: RequestOptions): PublicKeyCredentialRequestOptions {
  return {
    challenge: b64uToArr(opts.challenge),
    rpId: opts.rpId,
    allowCredentials: (opts.allowCredentials ?? []).map((c) => ({
      id: b64uToArr(c.id),
      type: 'public-key',
    })),
    timeout: opts.timeout,
    userVerification: opts.userVerification,
  };
}

function encodeCreated(cred: PublicKeyCredential) {
  const att = cred.response as AuthenticatorAttestationResponse;
  return {
    id:     cred.id,
    rawId:  arrToB64u(cred.rawId),
    type:   cred.type,
    response: {
      clientDataJSON:    arrToB64u(att.clientDataJSON),
      attestationObject: arrToB64u(att.attestationObject),
    },
    clientExtensionResults: cred.getClientExtensionResults?.() ?? {},
  };
}

function encodeAsserted(cred: PublicKeyCredential) {
  const a = cred.response as AuthenticatorAssertionResponse;
  return {
    id:     cred.id,
    rawId:  arrToB64u(cred.rawId),
    type:   cred.type,
    response: {
      clientDataJSON:    arrToB64u(a.clientDataJSON),
      authenticatorData: arrToB64u(a.authenticatorData),
      signature:         arrToB64u(a.signature),
      userHandle:        a.userHandle ? arrToB64u(a.userHandle) : null,
    },
    clientExtensionResults: cred.getClientExtensionResults?.() ?? {},
  };
}

export async function passkeyRegister(label?: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    return { ok: false, error: 'WebAuthn is not supported in this browser.' };
  }
  try {
    const { data: opts } = await api.post<CreationOptions>('/api/v1/auth/webauthn/register/options');
    const credential = await navigator.credentials.create({ publicKey: decodeCreate(opts) }) as PublicKeyCredential | null;
    if (!credential) return { ok: false, error: 'No credential returned by authenticator.' };
    await api.post('/api/v1/auth/webauthn/register/verify', {
      label,
      response: encodeCreated(credential),
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : unwrapError(e).message };
  }
}

export async function passkeyLogin(email?: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    throw new Error('WebAuthn is not supported in this browser.');
  }
  const { data: opts } = await api.post<RequestOptions>('/api/v1/auth/webauthn/login/options', email ? { email } : {});
  const cred = await navigator.credentials.get({ publicKey: decodeGet(opts) }) as PublicKeyCredential | null;
  if (!cred) throw new Error('No credential returned by authenticator.');
  await api.post('/api/v1/auth/webauthn/login/verify', {
    email,
    response: encodeAsserted(cred),
  });
  return { ok: true };
}
