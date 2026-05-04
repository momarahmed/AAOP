<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Secret;
use App\Models\Workspace;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Secret references (PRD §17.6 / T-F04-11). Values are NEVER stored or
 * returned by the API; only references and metadata.
 */
class SecretController extends Controller
{
    public function __construct(private readonly AuditLogger $audit)
    {
    }

    public function index(Request $request): JsonResponse
    {
        /** @var Workspace $workspace */
        $workspace = $request->attributes->get('workspace');

        $rows = Secret::query()
            ->where('workspace_id', $workspace->id)
            ->orderBy('name')
            ->get()
            ->map(fn (Secret $s) => [
                'id'              => $s->id,
                'name'            => $s->name,
                'rotation_policy' => $s->rotation_policy,
                'metadata'        => $s->metadata ?? [],
                'created_at'      => $s->created_at?->toIso8601String(),
            ]);

        return response()->json(['data' => $rows]);
    }

    public function store(Request $request): JsonResponse
    {
        /** @var Workspace $workspace */
        $workspace = $request->attributes->get('workspace');
        $this->authorize('workspace.manage', $workspace);

        $data = $request->validate([
            'name'      => ['required', 'string', 'max:80'],
            'vault_ref' => ['required', 'string', 'max:255'],
            'rotation_policy' => ['nullable', 'string', 'max:32'],
            'metadata'  => ['nullable', 'array'],
        ]);

        $secret = Secret::query()->create(array_merge($data, [
            'workspace_id' => $workspace->id,
            'created_by'   => $request->user()->id,
        ]));

        $this->audit->record(
            workspaceId: $workspace->id,
            actorId: $request->user()->id,
            actorType: 'user',
            action: 'secret.create',
            targetType: 'secret',
            targetId: $secret->id,
            meta: ['name' => $secret->name],
        );

        return response()->json(['id' => $secret->id, 'name' => $secret->name], 201);
    }

    public function destroy(Request $request, Secret $secret): JsonResponse
    {
        $this->authorize('workspace.manage', $secret->workspace);
        $name = $secret->name;
        $secret->delete();

        $this->audit->record(
            workspaceId: $secret->workspace_id,
            actorId: $request->user()->id,
            actorType: 'user',
            action: 'secret.delete',
            targetType: 'secret',
            targetId: $secret->id,
            meta: ['name' => $name],
        );

        return response()->json(['ok' => true]);
    }
}
