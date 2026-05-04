<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Policy;
use App\Models\Workspace;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Policy CRUD + dry-run evaluate (PRD §17.6 FR-F3 / T-F04-13).
 *
 * The actual OPA evaluator (T-F12-01) lands in Phase 3. The dry-run
 * endpoint currently returns a structured stub so the frontend designer
 * can render the policy linter UI.
 */
class PolicyController extends Controller
{
    public function __construct(private readonly AuditLogger $audit)
    {
    }

    public function index(Request $request): JsonResponse
    {
        /** @var Workspace $workspace */
        $workspace = $request->attributes->get('workspace');
        $rows = Policy::query()
            ->where('workspace_id', $workspace->id)
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn (Policy $p) => [
                'id'           => $p->id,
                'name'         => $p->name,
                'scope'        => $p->scope,
                'scope_id'     => $p->scope_id,
                'enforced_at'  => $p->enforced_at,
                'version'      => $p->version,
                'enabled'      => $p->enabled,
                'updated_at'   => $p->updated_at?->toIso8601String(),
            ]);
        return response()->json(['data' => $rows]);
    }

    public function store(Request $request): JsonResponse
    {
        /** @var Workspace $workspace */
        $workspace = $request->attributes->get('workspace');
        $this->authorize('workspace.manage', $workspace);

        $data = $request->validate([
            'name'         => ['required', 'string', 'max:120'],
            'scope'        => ['required', 'string', 'in:workspace,workflow,environment'],
            'scope_id'     => ['nullable', 'string', 'max:36'],
            'rego'         => ['nullable', 'string'],
            'schema'       => ['nullable', 'array'],
            'enforced_at'  => ['required', 'array'],
            'enforced_at.*' => ['string', 'in:design,deploy,run'],
            'version'      => ['required', 'integer', 'min:1'],
            'enabled'      => ['nullable', 'boolean'],
        ]);

        $p = Policy::query()->create(array_merge($data, [
            'workspace_id' => $workspace->id,
            'enabled'      => $data['enabled'] ?? true,
            'created_by'   => $request->user()->id,
        ]));

        $this->audit->record(
            workspaceId: $workspace->id,
            actorId: $request->user()->id,
            actorType: 'user',
            action: 'policy.create',
            targetType: 'policy',
            targetId: $p->id,
            meta: ['name' => $p->name, 'scope' => $p->scope, 'enforced_at' => $p->enforced_at],
        );

        return response()->json(['id' => $p->id, 'name' => $p->name, 'version' => $p->version], 201);
    }

    /** POST /v1/policies/{id}/evaluate — dry-run against payload */
    public function evaluate(Request $request, Policy $policy): JsonResponse
    {
        $this->authorize('workspace.view', $policy->workspace);

        $request->validate([
            'payload' => ['required', 'array'],
        ]);

        // Phase 3 will swap this for an OPA call. For now we return a
        // structured "no decisions" envelope that is shape-compatible so
        // the frontend Policy Linter UI can be wired end-to-end.
        return response()->json([
            'policy_id'    => $policy->id,
            'enforced_at'  => $policy->enforced_at,
            'allow'        => true,
            'violations'   => [],
            'warnings'     => [],
            'evaluated_at' => now()->toIso8601String(),
            'evaluator'    => 'stub-v0',
        ]);
    }
}
