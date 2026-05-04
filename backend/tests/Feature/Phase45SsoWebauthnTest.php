<?php

use App\Models\Membership;
use App\Models\User;
use App\Models\WebauthnCredential;
use App\Models\Workspace;
use App\Support\Rbac\Roles;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

beforeEach(function () {
    config([
        'services.sso.google.enabled'       => true,
        'services.sso.google.client_id'     => 'test-google-id',
        'services.sso.google.client_secret' => 'test-google-secret',
        'services.sso.frontend_callback'    => 'http://127.0.0.1:3000/login/sso/callback',
    ]);
});

it('lists SSO providers with configured flag', function () {
    $resp = $this->getJson('/api/v1/auth/sso/providers')->assertOk()->json('data');
    $google = collect($resp)->firstWhere('id', 'google');
    expect($google)->not->toBeNull();
    expect($google['configured'])->toBeTrue();
});

it('builds an OIDC authorize URL with state', function () {
    $resp = $this->postJson('/api/v1/auth/sso/google/redirect')
        ->assertOk()
        ->json();
    expect($resp['url'])->toStartWith('https://accounts.google.com/o/oauth2/v2/auth');
    expect($resp['url'])->toContain('client_id=test-google-id');
    expect($resp['state'])->toBeString();
});

it('completes the SSO callback and creates a workspace for a new user', function () {
    Http::fake([
        'oauth2.googleapis.com/token' => Http::response([
            'access_token' => 'fake-access', 'expires_in' => 3600, 'token_type' => 'Bearer',
        ]),
        'openidconnect.googleapis.com/v1/userinfo' => Http::response([
            'sub'    => 'g-1234567890',
            'email'  => 'newuser@example.com',
            'name'   => 'New SSO User',
        ]),
    ]);

    $authorize = $this->postJson('/api/v1/auth/sso/google/redirect')->json();
    $resp = $this->postJson('/api/v1/auth/sso/google/callback', [
        'code'  => 'fake-code',
        'state' => $authorize['state'],
    ])->assertOk();

    expect($resp->json('user.email'))->toBe('newuser@example.com');
    $user = User::query()->where('email', 'newuser@example.com')->firstOrFail();
    expect($user->default_workspace_id)->not->toBeNull();
    expect($user->oauthIdentities()->count())->toBe(1);
});

it('returns WebAuthn registration options for an authenticated user', function () {
    $user = User::factory()->create();
    $ws = Workspace::query()->create([
        'name' => 'WebAuthn WS', 'slug' => 'wa-'.uniqid(),
        'plan' => 'free', 'region' => 'us-ashburn-1',
    ]);
    Membership::query()->create([
        'user_id' => $user->id, 'workspace_id' => $ws->id, 'role' => Roles::OWNER,
    ]);
    $user->update(['default_workspace_id' => $ws->id]);
    $this->actingAs($user, 'web');

    $resp = $this->postJson('/api/v1/auth/webauthn/register/options')->assertOk()->json();
    expect($resp)->toHaveKeys(['challenge', 'rp', 'user', 'pubKeyCredParams']);
    expect($resp['rp']['id'])->toBe(config('services.webauthn.rp_id'));
});

it('registers a passkey via the dev attestation shortcut and lists credentials', function () {
    $user = User::factory()->create();
    $ws = Workspace::query()->create([
        'name' => 'Pk WS', 'slug' => 'pk-'.uniqid(),
        'plan' => 'free', 'region' => 'us-ashburn-1',
    ]);
    Membership::query()->create([
        'user_id' => $user->id, 'workspace_id' => $ws->id, 'role' => Roles::OWNER,
    ]);
    $user->update(['default_workspace_id' => $ws->id]);
    $this->actingAs($user, 'web');

    // First fetch options to seed challenge cache
    $this->postJson('/api/v1/auth/webauthn/register/options')->assertOk();

    $this->postJson('/api/v1/auth/webauthn/register/verify', [
        'label' => 'YubiKey 5 NFC',
        'response' => [
            'dev_attestation' => [
                'credential_id' => 'devcred-1',
                'public_key'    => base64_encode('fake-pub-key'),
                'transports'    => ['usb','nfc'],
            ],
        ],
    ])->assertCreated()->assertJsonPath('label', 'YubiKey 5 NFC');

    expect(WebauthnCredential::query()->where('user_id', $user->id)->count())->toBe(1);
});

it('logs in via WebAuthn assertion using a registered dev credential', function () {
    $user = User::factory()->create();
    $ws = Workspace::query()->create([
        'name' => 'Pk Login WS', 'slug' => 'pkl-'.uniqid(),
        'plan' => 'free', 'region' => 'us-ashburn-1',
    ]);
    Membership::query()->create([
        'user_id' => $user->id, 'workspace_id' => $ws->id, 'role' => Roles::OWNER,
    ]);
    $user->update(['default_workspace_id' => $ws->id]);

    WebauthnCredential::query()->create([
        'user_id'       => $user->id,
        'credential_id' => 'devcred-login-1',
        'public_key'    => base64_encode('fake-key'),
        'counter'       => 0,
        'transports'    => ['internal'],
    ]);

    // Seed challenge for assertion
    $this->postJson('/api/v1/auth/webauthn/login/options', ['email' => $user->email])->assertOk();

    $this->postJson('/api/v1/auth/webauthn/login/verify', [
        'email'    => $user->email,
        'response' => ['dev_credential_id' => 'devcred-login-1'],
    ])->assertOk()->assertJsonPath('user.email', $user->email);
});
