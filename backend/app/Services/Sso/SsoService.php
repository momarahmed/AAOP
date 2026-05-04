<?php

namespace App\Services\Sso;

use App\Models\Membership;
use App\Models\OauthIdentity;
use App\Models\User;
use App\Models\Workspace;
use App\Services\AuditLogger;
use App\Support\Rbac\Roles;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Hand-rolled OIDC client (PRD T-F02-02 / T-F02-03).
 *
 * Each provider config in `config('services.sso.<provider>')` declares
 * authorize/token/userinfo URLs and scopes. We intentionally avoid a
 * heavy Socialite dep so the OIDC surface is minimal and inspectable.
 *
 * The transport (`HTTP::post(...)`) is faked in feature tests via
 * `Http::fake([...])` so the flow can be validated end-to-end without
 * hitting Google / Microsoft / Okta.
 */
class SsoService
{
    public function __construct(private readonly AuditLogger $audit)
    {
    }

    /** @return array<string, array<string,mixed>> only enabled (or all in tests) */
    public function listProviders(bool $onlyEnabled = true): array
    {
        $providers = config('services.sso', []);
        $out = [];
        foreach (['google', 'microsoft', 'okta'] as $key) {
            $cfg = $providers[$key] ?? null;
            if (! $cfg) {
                continue;
            }
            if ($onlyEnabled && ! ($cfg['enabled'] ?? false)) {
                continue;
            }
            $out[$key] = [
                'id'      => $key,
                'label'   => $cfg['label'] ?? ucfirst($key),
                'enabled' => (bool) ($cfg['enabled'] ?? false),
                'configured' => ! empty($cfg['client_id']),
            ];
        }
        return $out;
    }

    /**
     * Build the authorize URL the SPA should redirect to.
     * Returns ['url' => ..., 'state' => ...]
     */
    public function authorizeUrl(string $provider, ?string $intent = 'login'): array
    {
        $cfg = $this->cfg($provider);
        $state = Str::random(32);
        $nonce = Str::random(24);

        cache()->put("sso:state:$state", json_encode([
            'provider' => $provider,
            'intent'   => $intent,
            'nonce'    => $nonce,
        ]), now()->addMinutes(10));

        $url = $this->resolveUrl($cfg['authorize_url'], $cfg);
        $params = [
            'client_id'     => $cfg['client_id'],
            'response_type' => 'code',
            'redirect_uri'  => config('services.sso.frontend_callback'),
            'scope'         => implode(' ', $cfg['scopes'] ?? ['openid', 'email', 'profile']),
            'state'         => $state,
            'nonce'         => $nonce,
        ];

        return [
            'url'   => $url . (str_contains($url, '?') ? '&' : '?') . http_build_query($params),
            'state' => $state,
        ];
    }

    /**
     * Exchange the authorization code for tokens, fetch userinfo,
     * find/create the local user and link the OIDC identity.
     *
     * @return User the local, hydrated user (caller signs them in via Auth::login)
     */
    public function exchange(string $provider, string $code, string $state): User
    {
        $cfg = $this->cfg($provider);

        $stateRecord = cache()->pull("sso:state:$state");
        if (! $stateRecord) {
            throw new RuntimeException('Invalid or expired SSO state.');
        }
        $stateData = json_decode($stateRecord, true);
        if (($stateData['provider'] ?? null) !== $provider) {
            throw new RuntimeException('SSO state does not match provider.');
        }

        $tokenResp = Http::asForm()->acceptJson()->post($this->resolveUrl($cfg['token_url'], $cfg), [
            'grant_type'    => 'authorization_code',
            'code'          => $code,
            'redirect_uri'  => config('services.sso.frontend_callback'),
            'client_id'     => $cfg['client_id'],
            'client_secret' => $cfg['client_secret'],
        ]);
        if (! $tokenResp->ok() || ! ($accessToken = $tokenResp->json('access_token'))) {
            throw new RuntimeException('SSO token exchange failed: '.$tokenResp->body());
        }

        $userInfo = Http::withToken($accessToken)
            ->acceptJson()
            ->get($this->resolveUrl($cfg['userinfo_url'], $cfg));
        if (! $userInfo->ok()) {
            throw new RuntimeException('SSO userinfo fetch failed: '.$userInfo->body());
        }
        $claims = $userInfo->json() ?? [];

        $providerUserId = (string) ($claims['sub'] ?? $claims['id'] ?? '');
        $email          = strtolower((string) ($claims['email'] ?? ''));
        if (! $providerUserId || ! $email) {
            throw new RuntimeException('SSO provider returned no `sub`/`email`.');
        }

        return DB::transaction(function () use ($provider, $providerUserId, $email, $claims) {
            $identity = OauthIdentity::query()
                ->where('provider', $provider)
                ->where('provider_user_id', $providerUserId)
                ->first();

            if ($identity) {
                $user = $identity->user;
            } else {
                $user = User::query()->where('email', $email)->first();
                if (! $user) {
                    $user = User::query()->create([
                        'email'           => $email,
                        'display_name'    => $claims['name'] ?? null,
                        'hashed_password' => Hash::make(Str::random(64)), // unusable
                        'email_verified_at' => now(),
                    ]);

                    $wsName = ($claims['name'] ?? 'My')." Workspace";
                    $workspace = Workspace::query()->create([
                        'name' => $wsName,
                        'slug' => Str::slug($wsName).'-'.Str::lower(Str::random(6)),
                        'plan' => 'free',
                        'region' => config('app.aaop.tenant_default_region'),
                    ]);
                    Membership::query()->create([
                        'user_id'      => $user->id,
                        'workspace_id' => $workspace->id,
                        'role'         => Roles::OWNER,
                    ]);
                    $user->update(['default_workspace_id' => $workspace->id]);
                }

                OauthIdentity::query()->create([
                    'user_id'          => $user->id,
                    'provider'         => $provider,
                    'provider_user_id' => $providerUserId,
                    'email'            => $email,
                    'claims'           => $claims,
                    'linked_at'        => now(),
                    'last_login_at'    => now(),
                ]);
            }

            OauthIdentity::query()
                ->where('provider', $provider)
                ->where('provider_user_id', $providerUserId)
                ->update(['last_login_at' => now(), 'email' => $email]);

            $user->update(['last_seen_at' => now()]);

            $this->audit->record(
                workspaceId: $user->default_workspace_id,
                actorId: $user->id,
                actorType: 'user',
                action: 'sso.login',
                targetType: 'user',
                targetId: $user->id,
                meta: ['provider' => $provider, 'email' => $email],
            );

            return $user;
        });
    }

    /** @return array<string,mixed> */
    protected function cfg(string $provider): array
    {
        $cfg = config("services.sso.$provider");
        if (! $cfg) {
            throw new RuntimeException("Unknown SSO provider: $provider");
        }
        if (empty($cfg['client_id']) || empty($cfg['client_secret'])) {
            throw new RuntimeException("SSO provider $provider is not configured.");
        }
        return $cfg;
    }

    protected function resolveUrl(string $url, array $cfg): string
    {
        return strtr($url, [
            '{tenant}' => (string) ($cfg['tenant'] ?? 'common'),
            '{domain}' => (string) ($cfg['domain'] ?? ''),
        ]);
    }
}
