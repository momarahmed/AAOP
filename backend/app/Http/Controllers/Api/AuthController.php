<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Membership;
use App\Models\User;
use App\Models\Workspace;
use App\Services\AuditLogger;
use App\Support\Rbac\Roles;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Cookie-based SPA auth using Sanctum (PRD §17.6 FR-F1, T-F02-01).
 *
 * Endpoints
 *   POST /sanctum/csrf-cookie    -> issue XSRF token (handled by Sanctum)
 *   POST /api/v1/auth/register
 *   POST /api/v1/auth/login
 *   POST /api/v1/auth/logout
 *   GET  /api/v1/auth/me
 */
class AuthController extends Controller
{
    public function __construct(private readonly AuditLogger $audit)
    {
    }

    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email'        => ['required', 'email', 'max:255', 'unique:users,email'],
            'password'     => ['required', 'string', 'min:12', 'confirmed'],
            'display_name' => ['nullable', 'string', 'max:120'],
            'workspace_name' => ['nullable', 'string', 'max:120'],
        ]);

        return DB::transaction(function () use ($data, $request) {
            $user = User::query()->create([
                'email'           => strtolower($data['email']),
                'display_name'    => $data['display_name'] ?? null,
                'hashed_password' => Hash::make($data['password']),
            ]);

            // Auto-provision a starter workspace + owner membership so the
            // SPA has a valid context immediately after sign-up.
            $workspaceName = $data['workspace_name'] ?? ($user->display_name ? $user->display_name."'s Workspace" : 'My Workspace');
            $workspace = Workspace::query()->create([
                'name' => $workspaceName,
                'slug' => Str::slug($workspaceName).'-'.Str::lower(Str::random(6)),
                'plan' => 'free',
                'region' => config('app.aaop.tenant_default_region'),
            ]);

            Membership::query()->create([
                'user_id'      => $user->id,
                'workspace_id' => $workspace->id,
                'role'         => Roles::OWNER,
            ]);

            $user->update(['default_workspace_id' => $workspace->id]);

            Auth::guard('web')->login($user, true);
            if ($request->hasSession()) {
                $request->session()->regenerate();
            }

            $this->audit->record(
                workspaceId: $workspace->id,
                actorId: $user->id,
                actorType: 'user',
                action: 'user.register',
                targetType: 'user',
                targetId: $user->id,
                meta: ['email' => $user->email],
            );

            return response()->json([
                'user'      => $this->presentUser($user),
                'workspace' => $this->presentWorkspace($workspace, Roles::OWNER),
            ], 201);
        });
    }

    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
            'remember' => ['nullable', 'boolean'],
        ]);

        $user = User::query()->where('email', strtolower($credentials['email']))->first();
        if (! $user || ! Hash::check($credentials['password'], $user->hashed_password)) {
            $this->audit->record(
                workspaceId: null,
                actorId: $user?->id,
                actorType: 'user',
                action: 'user.login.failed',
                targetType: 'user',
                targetId: $user?->id,
                meta: ['email' => $credentials['email'], 'ip' => $request->ip()],
            );
            throw ValidationException::withMessages([
                'email' => 'Invalid credentials.',
            ]);
        }

        Auth::guard('web')->login($user, (bool) ($credentials['remember'] ?? false));
        if ($request->hasSession()) {
            $request->session()->regenerate();
        }
        $user->update(['last_seen_at' => now()]);

        $workspace = $user->defaultWorkspace();

        $this->audit->record(
            workspaceId: $workspace?->id,
            actorId: $user->id,
            actorType: 'user',
            action: 'user.login',
            targetType: 'user',
            targetId: $user->id,
            meta: ['email' => $user->email, 'ip' => $request->ip()],
        );

        return response()->json([
            'user'      => $this->presentUser($user),
            'workspace' => $workspace ? $this->presentWorkspace($workspace, $workspace->roleFor($user)) : null,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        Auth::guard('web')->logout();
        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        if ($user) {
            $this->audit->record(
                workspaceId: $user->default_workspace_id,
                actorId: $user->id,
                actorType: 'user',
                action: 'user.logout',
                targetType: 'user',
                targetId: $user->id,
                meta: null,
            );
        }
        return response()->json(['ok' => true]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $workspaces = $user->workspaces()->get()->map(function (Workspace $w) use ($user) {
            return $this->presentWorkspace($w, $w->roleFor($user));
        });
        return response()->json([
            'user'       => $this->presentUser($user),
            'workspaces' => $workspaces,
        ]);
    }

    protected function presentUser(User $user): array
    {
        return [
            'id'                  => $user->id,
            'email'               => $user->email,
            'display_name'        => $user->display_name,
            'is_admin'            => (bool) $user->is_admin,
            'mfa_enabled'         => (bool) $user->mfa_enabled,
            'default_workspace_id' => $user->default_workspace_id,
            'last_seen_at'        => $user->last_seen_at?->toIso8601String(),
        ];
    }

    protected function presentWorkspace(Workspace $w, ?string $role): array
    {
        return [
            'id'         => $w->id,
            'name'       => $w->name,
            'slug'       => $w->slug,
            'plan'       => $w->plan,
            'region'     => $w->region,
            'role'       => $role,
            'created_at' => $w->created_at?->toIso8601String(),
        ];
    }
}
