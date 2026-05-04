import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

/**
 * Server-side base URL (SSR / Node). Rewrites in `next.config.mjs` only run
 * for browser HTTP → Next; in-process axios must hit Laravel directly.
 */
function serverApiBase(): string {
  return (
    process.env.INTERNAL_API_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    'http://127.0.0.1:8000'
  );
}

/**
 * Browser base URL for API calls.
 *
 * Default: always `''` (same origin) so requests go to `/api` and `/sanctum`
 * on the Next host; rewrites proxy to Laravel and Sanctum CSRF cookies work.
 *
 * If `NEXT_PUBLIC_API_URL` is set (e.g. old `.env` or cached `.next`), the
 * browser would POST to `http://127.0.0.1:8002` directly → 419 because
 * `XSRF-TOKEN` is not visible in `document.cookie` on the page origin.
 * We therefore ignore `NEXT_PUBLIC_API_URL` in the browser unless the caller
 * explicitly opts in with `NEXT_PUBLIC_API_DIRECT=true` (non–cookie-auth setups).
 */
function browserApiBase(): string {
  if (process.env.NEXT_PUBLIC_API_DIRECT === 'true') {
    return process.env.NEXT_PUBLIC_API_URL?.trim() || '';
  }
  return '';
}

function resolveApiBase(): string {
  if (typeof window !== 'undefined') {
    return browserApiBase();
  }
  return serverApiBase();
}

/**
 * AAOP API client (PRD §20).
 *
 * - Cookie-based Sanctum SPA auth (`withCredentials: true`)
 * - Auto-fetches the XSRF cookie before unsafe verbs
 * - `baseURL` is set per request so SSR vs browser never pick up the wrong host
 */
export function getApiBase(): string {
  return resolveApiBase();
}

/** Same-origin-safe path for `<a href>` (export, download) in the browser. */
export function browserApiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  const base = (typeof window !== 'undefined' ? browserApiBase() : serverApiBase()).replace(
    /\/$/,
    '',
  );
  return base ? `${base}${p}` : p;
}

let csrfReady = false;

async function ensureCsrf(api: AxiosInstance) {
  if (csrfReady) return;
  await api.get('/sanctum/csrf-cookie');
  csrfReady = true;
}

export function getActiveWorkspaceId(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('aaop:workspace_id');
}

export function setActiveWorkspaceId(id: string | null) {
  if (typeof window === 'undefined') return;
  if (id) window.localStorage.setItem('aaop:workspace_id', id);
  else    window.localStorage.removeItem('aaop:workspace_id');
}

export const api: AxiosInstance = axios.create({
  withCredentials: true,
  headers: { Accept: 'application/json' },
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
});

api.interceptors.request.use(async (cfg: InternalAxiosRequestConfig) => {
  cfg.baseURL = resolveApiBase();

  const method = (cfg.method ?? 'get').toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    await ensureCsrf(api);
  }
  const wsId = getActiveWorkspaceId();
  if (wsId && !cfg.headers?.['X-Workspace-Id']) {
    cfg.headers = cfg.headers ?? {};
    (cfg.headers as Record<string, string>)['X-Workspace-Id'] = wsId;
  }
  return cfg;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (axios.isAxiosError(err) && err.response?.status === 419) {
      csrfReady = false;
    }
    return Promise.reject(err);
  },
);

export type ApiError = {
  code: string;
  message: string;
  type: string;
  details?: unknown;
  correlation_id?: string | null;
};

function validationMessages(error: ApiError): string | null {
  if (error.code !== 'validation_error' || !error.details || typeof error.details !== 'object') {
    return null;
  }
  const raw = (error.details as { errors?: Record<string, string[] | string> }).errors;
  if (!raw || typeof raw !== 'object') return null;
  const lines = Object.values(raw).flatMap((v) => (Array.isArray(v) ? v : [String(v)]));
  const first = lines.find((s) => String(s).trim() !== '');
  return first ? String(first) : null;
}

export function unwrapError(err: unknown): ApiError {
  if (axios.isAxiosError(err)) {
    const ae = err as AxiosError<{ error?: ApiError }>;
    if (ae.response?.data?.error) {
      const base = ae.response.data.error;
      const specific = validationMessages(base);
      if (specific) return { ...base, message: specific };
      return base;
    }
    return {
      code: 'network_error',
      message: ae.message || 'Network error',
      type: 'network',
    };
  }
  return {
    code: 'unknown_error',
    message: err instanceof Error ? err.message : 'Unknown error',
    type: 'internal',
  };
}
