<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Webauthn\WebauthnService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Throwable;

/**
 * WebAuthn / FIDO2 endpoints (Phase 4-5; PRD T-F02 modernisation).
 *
 *   POST /api/v1/auth/webauthn/register/options    (auth required)
 *   POST /api/v1/auth/webauthn/register/verify     (auth required) -> stores credential
 *   POST /api/v1/auth/webauthn/login/options       (anon ok)
 *   POST /api/v1/auth/webauthn/login/verify        (anon ok)        -> opens session
 *   GET  /api/v1/auth/webauthn/credentials         (auth required) -> list user passkeys
 *   DELETE /api/v1/auth/webauthn/credentials/{id}
 */
class WebauthnController extends Controller
{
    public function __construct(private readonly WebauthnService $webauthn)
    {
    }

    public function registerOptions(Request $request): JsonResponse
    {
        $opts = $this->webauthn->registrationOptions($request->user());
        return response()->json($opts);
    }

    public function registerVerify(Request $request): JsonResponse
    {
        $data = $request->validate([
            'response'        => ['required', 'array'],
            'label'           => ['nullable', 'string', 'max:80'],
        ]);
        try {
            $cred = $this->webauthn->verifyRegistration(
                $request->user(),
                $data['response'],
                $data['label'] ?? null,
            );
            return response()->json([
                'id'            => $cred->id,
                'credential_id' => $cred->credential_id,
                'label'         => $cred->label,
                'created_at'    => $cred->created_at?->toIso8601String(),
            ], 201);
        } catch (Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    public function loginOptions(Request $request): JsonResponse
    {
        $email = $request->input('email');
        $user = $email ? User::query()->where('email', strtolower($email))->first() : null;
        $opts = $this->webauthn->assertionOptions($user);
        return response()->json($opts);
    }

    public function loginVerify(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email'    => ['nullable', 'email'],
            'response' => ['required', 'array'],
        ]);
        $userHint = $data['email']
            ? User::query()->where('email', strtolower($data['email']))->first()
            : null;
        try {
            $user = $this->webauthn->verifyAssertion($data['response'], $userHint);
            Auth::guard('web')->login($user, true);
            if ($request->hasSession()) {
                $request->session()->regenerate();
            }
            $user->update(['last_seen_at' => now()]);
            return response()->json([
                'user' => [
                    'id'           => $user->id,
                    'email'        => $user->email,
                    'display_name' => $user->display_name,
                ],
            ]);
        } catch (Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    public function credentials(Request $request): JsonResponse
    {
        $rows = $request->user()->webauthnCredentials()->orderByDesc('created_at')->get()->map(fn ($c) => [
            'id'            => $c->id,
            'credential_id' => $c->credential_id,
            'label'         => $c->label,
            'transports'    => $c->transports ?? [],
            'last_used_at'  => $c->last_used_at?->toIso8601String(),
            'created_at'    => $c->created_at?->toIso8601String(),
        ]);
        return response()->json(['data' => $rows]);
    }

    public function deleteCredential(Request $request, string $id): JsonResponse
    {
        $cred = $request->user()->webauthnCredentials()->where('id', $id)->firstOrFail();
        $cred->delete();
        return response()->json(['ok' => true]);
    }
}
