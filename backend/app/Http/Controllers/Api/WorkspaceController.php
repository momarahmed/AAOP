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
use Illuminate\Support\Str;

class WorkspaceController extends Controller
{
    public function __construct(private readonly AuditLogger $audit)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $items = $user->workspaces()->get()->map(function (Workspace $w) use ($user) {
            return [
                'id'     => $w->id,
                'name'   => $w->name,
                'slug'   => $w->slug,
                'plan'   => $w->plan,
                'region' => $w->region,
                'role'   => $w->roleFor($user),
                'created_at' => $w->created_at?->toIso8601String(),
            ];
        });
        return response()->json(['data' => $items]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'   => ['required', 'string', 'max:120'],
            'plan'   => ['nullable', 'string', 'in:free,pro,team,enterprise'],
            'region' => ['nullable', 'string', 'max:32'],
        ]);

        $w = Workspace::query()->create([
            'name'   => $data['name'],
            'slug'   => Str::slug($data['name']).'-'.Str::lower(Str::random(6)),
            'plan'   => $data['plan'] ?? 'free',
            'region' => $data['region'] ?? config('app.aaop.tenant_default_region'),
        ]);

        Membership::query()->create([
            'user_id'      => $request->user()->id,
            'workspace_id' => $w->id,
            'role'         => Roles::OWNER,
        ]);

        $this->audit->record(
            workspaceId: $w->id,
            actorId: $request->user()->id,
            actorType: 'user',
            action: 'workspace.create',
            targetType: 'workspace',
            targetId: $w->id,
            meta: ['name' => $w->name],
        );

        return response()->json(['id' => $w->id, 'name' => $w->name, 'slug' => $w->slug, 'role' => Roles::OWNER], 201);
    }

    public function members(Request $request, Workspace $workspace): JsonResponse
    {
        if ($workspace->roleFor($request->user()) === null) {
            abort(403);
        }
        $rows = Membership::query()
            ->where('workspace_id', $workspace->id)
            ->with('user:id,email,display_name,last_seen_at')
            ->get()
            ->map(fn (Membership $m) => [
                'user_id'  => $m->user_id,
                'email'    => $m->user?->email,
                'name'     => $m->user?->display_name,
                'role'     => $m->role,
                'last_seen_at' => $m->user?->last_seen_at?->toIso8601String(),
            ]);

        return response()->json(['data' => $rows]);
    }

    public function invite(Request $request, Workspace $workspace): JsonResponse
    {
        $this->authorize('workspace.manage', $workspace);

        $data = $request->validate([
            'email' => ['required', 'email'],
            'role'  => ['required', 'string', 'in:'.implode(',', Roles::ALL)],
        ]);

        $invitee = User::query()->where('email', strtolower($data['email']))->firstOrFail();

        Membership::query()->updateOrCreate(
            ['user_id' => $invitee->id, 'workspace_id' => $workspace->id],
            ['role' => $data['role']]
        );

        $this->audit->record(
            workspaceId: $workspace->id,
            actorId: $request->user()->id,
            actorType: 'user',
            action: 'workspace.member.invite',
            targetType: 'user',
            targetId: $invitee->id,
            meta: ['role' => $data['role'], 'email' => $invitee->email],
        );

        return response()->json(['ok' => true, 'user_id' => $invitee->id, 'role' => $data['role']]);
    }
}
