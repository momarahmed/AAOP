<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Sso\SsoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Throwable;

/**
 * Federated SSO endpoints (Phase 4-5; PRD T-F02-02 / T-F02-03).
 *
 *   GET  /api/v1/auth/sso/providers
 *   POST /api/v1/auth/sso/{provider}/redirect    -> { url, state }
 *   POST /api/v1/auth/sso/{provider}/callback    -> body { code, state } -> session
 */
class SsoController extends Controller
{
    public function __construct(private readonly SsoService $sso)
    {
    }

    public function providers(): JsonResponse
    {
        $onlyEnabled = ! app()->environment('testing');
        return response()->json(['data' => array_values($this->sso->listProviders($onlyEnabled))]);
    }

    public function redirect(Request $request, string $provider): JsonResponse
    {
        try {
            $payload = $this->sso->authorizeUrl($provider, $request->query('intent', 'login'));
            return response()->json($payload);
        } catch (Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    public function callback(Request $request, string $provider): JsonResponse
    {
        $data = $request->validate([
            'code'  => ['required', 'string'],
            'state' => ['required', 'string'],
        ]);
        try {
            $user = $this->sso->exchange($provider, $data['code'], $data['state']);
            Auth::guard('web')->login($user, true);
            if ($request->hasSession()) {
                $request->session()->regenerate();
            }
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
}
