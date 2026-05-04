<?php

namespace App\Services\Webauthn;

use App\Models\User;
use App\Models\WebauthnCredential;
use App\Services\AuditLogger;
use Illuminate\Support\Str;
use RuntimeException;
use Webauthn\AttestationStatement\AttestationObjectLoader;
use Webauthn\AttestationStatement\AttestationStatementSupportManager;
use Webauthn\AttestationStatement\NoneAttestationStatementSupport;
use Webauthn\AuthenticatorAssertionResponse;
use Webauthn\AuthenticatorAssertionResponseValidator;
use Webauthn\AuthenticatorAttestationResponse;
use Webauthn\AuthenticatorAttestationResponseValidator;
use Webauthn\AuthenticatorSelectionCriteria;
use Webauthn\CeremonyStep\CeremonyStepManagerFactory;
use Webauthn\Denormalizer\WebauthnSerializerFactory;
use Webauthn\PublicKeyCredentialCreationOptions;
use Webauthn\PublicKeyCredentialDescriptor;
use Webauthn\PublicKeyCredentialParameters;
use Webauthn\PublicKeyCredentialRequestOptions;
use Webauthn\PublicKeyCredentialRpEntity;
use Webauthn\PublicKeyCredentialSource;
use Webauthn\PublicKeyCredentialUserEntity;

/**
 * WebAuthn / FIDO2 ceremonies (PRD §17.6 / FR-F1; T-F02 modernisation).
 *
 *   1. registrationOptions(User)             -> options JSON for navigator.credentials.create()
 *   2. verifyRegistration(User, response)    -> stores WebauthnCredential
 *   3. assertionOptions(?User)               -> options JSON for navigator.credentials.get()
 *   4. verifyAssertion(response)             -> returns the User to log in
 *
 * In `testing` env we accept a `dev_attestation` shortcut so we can
 * feature-test the registration flow without a real authenticator. Real
 * cryptographic verification (`web-auth/webauthn-lib`) is used outside
 * of testing.
 */
class WebauthnService
{
    public function __construct(private readonly AuditLogger $audit)
    {
    }

    // ---------------------------------------------------------------
    // Registration
    // ---------------------------------------------------------------

    public function registrationOptions(User $user): array
    {
        $options = PublicKeyCredentialCreationOptions::create(
            rp: new PublicKeyCredentialRpEntity(
                name: (string) config('services.webauthn.rp_name'),
                id: (string) config('services.webauthn.rp_id'),
            ),
            user: new PublicKeyCredentialUserEntity(
                name: $user->email,
                id: hash('sha256', $user->id, true),
                displayName: $user->display_name ?? $user->email,
            ),
            challenge: random_bytes(32),
            pubKeyCredParams: [
                PublicKeyCredentialParameters::create('public-key', -7),  // ES256
                PublicKeyCredentialParameters::create('public-key', -257), // RS256
            ],
            authenticatorSelection: AuthenticatorSelectionCriteria::create(
                userVerification: AuthenticatorSelectionCriteria::USER_VERIFICATION_REQUIREMENT_PREFERRED,
            ),
            timeout: (int) config('services.webauthn.timeout_ms', 60000),
            excludeCredentials: $user->webauthnCredentials()->get()->map(
                fn (WebauthnCredential $c) => PublicKeyCredentialDescriptor::create(
                    'public-key',
                    base64_decode(strtr($c->credential_id, '-_', '+/')),
                )
            )->all(),
        );

        cache()->put($this->challengeKey('reg', $user->id), base64_encode($options->challenge), now()->addMinutes(5));

        $serializer = (new WebauthnSerializerFactory(
            new AttestationStatementSupportManager()
        ))->create();
        $payload = json_decode($serializer->serialize($options, 'json'), true);

        return $payload;
    }

    public function verifyRegistration(User $user, array $response, ?string $label = null): WebauthnCredential
    {
        $challenge = cache()->pull($this->challengeKey('reg', $user->id));
        if (! $challenge) {
            throw new RuntimeException('No active WebAuthn registration challenge.');
        }

        if (app()->environment('testing') && isset($response['dev_attestation'])) {
            return $this->storeDevCredential($user, $response['dev_attestation'], $label);
        }

        $options = $this->buildCreationOptionsForVerification($user, base64_decode($challenge));

        $serializer = (new WebauthnSerializerFactory(
            new AttestationStatementSupportManager([new NoneAttestationStatementSupport()])
        ))->create();
        /** @var \Webauthn\PublicKeyCredential $credential */
        $credential = $serializer->deserialize(json_encode($response), \Webauthn\PublicKeyCredential::class, 'json');

        $authenticatorResponse = $credential->response;
        if (! $authenticatorResponse instanceof AuthenticatorAttestationResponse) {
            throw new RuntimeException('Invalid attestation response payload.');
        }

        $factory = new CeremonyStepManagerFactory();
        $factory->setAllowedOrigins([(string) config('services.webauthn.origin')]);
        $factory->setAttestationStatementSupportManager(
            new AttestationStatementSupportManager([new NoneAttestationStatementSupport()])
        );
        $validator = new AuthenticatorAttestationResponseValidator($factory->creationCeremony());

        $record = $validator->check(
            $authenticatorResponse,
            $options,
            (string) config('services.webauthn.rp_id'),
        );

        return $this->persistRecord($user, $record, $label);
    }

    // ---------------------------------------------------------------
    // Assertion (login)
    // ---------------------------------------------------------------

    public function assertionOptions(?User $user = null): array
    {
        $allow = $user
            ? $user->webauthnCredentials()->get()->map(
                fn (WebauthnCredential $c) => PublicKeyCredentialDescriptor::create(
                    'public-key',
                    base64_decode(strtr($c->credential_id, '-_', '+/')),
                )
            )->all()
            : [];

        $options = PublicKeyCredentialRequestOptions::create(
            challenge: random_bytes(32),
            rpId: (string) config('services.webauthn.rp_id'),
            allowCredentials: $allow,
            userVerification: AuthenticatorSelectionCriteria::USER_VERIFICATION_REQUIREMENT_PREFERRED,
            timeout: (int) config('services.webauthn.timeout_ms', 60000),
        );

        cache()->put(
            $this->challengeKey('auth', $user?->id ?? 'anon'),
            base64_encode($options->challenge),
            now()->addMinutes(5)
        );

        $serializer = (new WebauthnSerializerFactory(
            new AttestationStatementSupportManager()
        ))->create();
        return json_decode($serializer->serialize($options, 'json'), true);
    }

    public function verifyAssertion(array $response, ?User $userHint = null): User
    {
        $cacheKey = $this->challengeKey('auth', $userHint?->id ?? 'anon');
        $challenge = cache()->pull($cacheKey);
        if (! $challenge) {
            throw new RuntimeException('No active WebAuthn assertion challenge.');
        }

        if (app()->environment('testing') && isset($response['dev_credential_id'])) {
            return $this->verifyDevAssertion($response['dev_credential_id']);
        }

        $serializer = (new WebauthnSerializerFactory(
            new AttestationStatementSupportManager([new NoneAttestationStatementSupport()])
        ))->create();
        /** @var \Webauthn\PublicKeyCredential $credential */
        $credential = $serializer->deserialize(json_encode($response), \Webauthn\PublicKeyCredential::class, 'json');
        $authenticatorResponse = $credential->response;
        if (! $authenticatorResponse instanceof AuthenticatorAssertionResponse) {
            throw new RuntimeException('Invalid assertion response payload.');
        }

        $rawId = $credential->rawId;
        $stored = WebauthnCredential::query()
            ->where('credential_id', $this->b64u($rawId))
            ->firstOrFail();

        $record = PublicKeyCredentialSource::create(
            publicKeyCredentialId: $rawId,
            type: 'public-key',
            transports: $stored->transports ?? [],
            attestationType: 'none',
            trustPath: new \Webauthn\TrustPath\EmptyTrustPath(),
            aaguid: \Symfony\Component\Uid\Uuid::fromString($stored->aaguid ?? '00000000-0000-0000-0000-000000000000'),
            credentialPublicKey: base64_decode($stored->public_key),
            userHandle: hash('sha256', $stored->user_id, true),
            counter: (int) $stored->counter,
        );

        $options = PublicKeyCredentialRequestOptions::create(
            challenge: base64_decode($challenge),
            rpId: (string) config('services.webauthn.rp_id'),
            allowCredentials: [PublicKeyCredentialDescriptor::create('public-key', $rawId)],
            userVerification: AuthenticatorSelectionCriteria::USER_VERIFICATION_REQUIREMENT_PREFERRED,
            timeout: (int) config('services.webauthn.timeout_ms', 60000),
        );

        $factory = new CeremonyStepManagerFactory();
        $factory->setAllowedOrigins([(string) config('services.webauthn.origin')]);
        $factory->setAttestationStatementSupportManager(
            new AttestationStatementSupportManager([new NoneAttestationStatementSupport()])
        );
        $validator = new AuthenticatorAssertionResponseValidator($factory->requestCeremony());

        $updatedRecord = $validator->check(
            $record,
            $authenticatorResponse,
            $options,
            (string) config('services.webauthn.rp_id'),
            hash('sha256', $stored->user_id, true),
        );

        $stored->update([
            'counter'      => $updatedRecord->counter,
            'last_used_at' => now(),
        ]);

        $this->audit->record(
            workspaceId: $stored->user->default_workspace_id,
            actorId: $stored->user_id,
            actorType: 'user',
            action: 'webauthn.login',
            targetType: 'webauthn_credential',
            targetId: $stored->id,
            meta: ['credential_id' => $stored->credential_id],
        );

        return $stored->user;
    }

    // ---------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------

    protected function challengeKey(string $kind, string $key): string
    {
        return "webauthn:$kind:$key";
    }

    protected function b64u(string $raw): string
    {
        return rtrim(strtr(base64_encode($raw), '+/', '-_'), '=');
    }

    protected function buildCreationOptionsForVerification(User $user, string $challenge): PublicKeyCredentialCreationOptions
    {
        return PublicKeyCredentialCreationOptions::create(
            rp: new PublicKeyCredentialRpEntity(
                name: (string) config('services.webauthn.rp_name'),
                id: (string) config('services.webauthn.rp_id'),
            ),
            user: new PublicKeyCredentialUserEntity(
                name: $user->email,
                id: hash('sha256', $user->id, true),
                displayName: $user->display_name ?? $user->email,
            ),
            challenge: $challenge,
            pubKeyCredParams: [
                PublicKeyCredentialParameters::create('public-key', -7),
                PublicKeyCredentialParameters::create('public-key', -257),
            ],
            authenticatorSelection: AuthenticatorSelectionCriteria::create(
                userVerification: AuthenticatorSelectionCriteria::USER_VERIFICATION_REQUIREMENT_PREFERRED,
            ),
            timeout: (int) config('services.webauthn.timeout_ms', 60000),
        );
    }

    protected function persistRecord(User $user, $record, ?string $label): WebauthnCredential
    {
        $credentialId = $this->b64u($record->publicKeyCredentialId);
        return WebauthnCredential::query()->updateOrCreate(
            ['credential_id' => $credentialId],
            [
                'user_id'            => $user->id,
                'public_key'         => base64_encode($record->credentialPublicKey ?? ''),
                'counter'            => (int) $record->counter,
                'aaguid'             => $record->aaguid?->toString(),
                'transports'         => $record->transports ?? [],
                'attestation_format' => $record->attestationType ?? 'none',
                'label'              => $label,
                'last_used_at'       => now(),
            ]
        );
    }

    protected function storeDevCredential(User $user, array $payload, ?string $label): WebauthnCredential
    {
        $cred = WebauthnCredential::query()->create([
            'user_id'            => $user->id,
            'credential_id'      => $payload['credential_id'] ?? Str::uuid()->toString(),
            'public_key'         => $payload['public_key']    ?? base64_encode(random_bytes(64)),
            'counter'            => (int) ($payload['counter'] ?? 0),
            'aaguid'             => $payload['aaguid'] ?? null,
            'transports'         => $payload['transports'] ?? ['internal'],
            'attestation_format' => 'none',
            'label'              => $label,
            'last_used_at'       => now(),
        ]);

        $this->audit->record(
            workspaceId: $user->default_workspace_id,
            actorId: $user->id,
            actorType: 'user',
            action: 'webauthn.register',
            targetType: 'webauthn_credential',
            targetId: $cred->id,
            meta: ['label' => $label, 'dev' => true],
        );
        return $cred;
    }

    protected function verifyDevAssertion(string $credentialId): User
    {
        $stored = WebauthnCredential::query()
            ->where('credential_id', $credentialId)
            ->firstOrFail();
        $stored->update(['last_used_at' => now()]);

        $this->audit->record(
            workspaceId: $stored->user->default_workspace_id,
            actorId: $stored->user_id,
            actorType: 'user',
            action: 'webauthn.login',
            targetType: 'webauthn_credential',
            targetId: $stored->id,
            meta: ['credential_id' => $stored->credential_id, 'dev' => true],
        );
        return $stored->user;
    }
}
