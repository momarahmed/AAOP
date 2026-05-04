<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Workflow;
use App\Models\Workspace;
use App\Services\AuditLogger;
use App\Services\WorkflowService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * REST contract per PRD §20.3 (Workflows).
 *
 *   POST   /v1/workflows
 *   GET    /v1/workflows
 *   GET    /v1/workflows/{id}
 *   PATCH  /v1/workflows/{id}
 *   DELETE /v1/workflows/{id}
 *   POST   /v1/workflows/{id}/versions
 *   GET    /v1/workflows/{id}/versions
 *   POST   /v1/workflows/{id}/promote
 */
class WorkflowController extends Controller
{
    public function __construct(
        private readonly WorkflowService $workflows,
        private readonly AuditLogger $audit,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        /** @var Workspace $workspace */
        $workspace = $request->attributes->get('workspace');

        $cursor = $request->query('cursor');
        $limit  = (int) min(max((int) $request->query('limit', 25), 1), 100);

        $q = Workflow::query()
            ->where('workspace_id', $workspace->id)
            ->orderByDesc('updated_at');

        if ($search = trim((string) $request->query('q', ''))) {
            $q->where('name', 'like', '%'.$search.'%');
        }
        if ($status = $request->query('status')) {
            $q->where('status', $status);
        }
        if ($env = $request->query('environment')) {
            $q->where('environment', $env);
        }

        $page = $q->cursorPaginate($limit, ['*'], 'cursor', $cursor);

        return response()->json([
            'data' => collect($page->items())->map(fn (Workflow $w) => $this->present($w)),
            'next_cursor' => $page->nextCursor()?->encode(),
            'prev_cursor' => $page->previousCursor()?->encode(),
            'limit' => $limit,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        /** @var Workspace $workspace */
        $workspace = $request->attributes->get('workspace');

        $data = $request->validate([
            'name'        => ['required', 'string', 'min:1', 'max:80'],
            'description' => ['nullable', 'string', 'max:2000'],
            'tags'        => ['nullable', 'array'],
            'tags.*'      => ['string', 'max:32'],
        ]);

        $workflow = $this->workflows->create(
            workspace: $workspace,
            actor: $request->user(),
            name: trim($data['name']),
            description: $data['description'] ?? null,
            tags: $data['tags'] ?? null,
        );

        return response()->json($this->present($workflow), 201);
    }

    public function show(Request $request, Workflow $workflow): JsonResponse
    {
        $this->authorize('workflow.view', $workflow);
        return response()->json($this->present($workflow->loadMissing('currentVersion', 'creator:id,email,display_name')));
    }

    public function update(Request $request, Workflow $workflow): JsonResponse
    {
        $this->authorize('workflow.edit', $workflow);

        $data = $request->validate([
            'name'        => ['nullable', 'string', 'min:1', 'max:80'],
            'description' => ['nullable', 'string', 'max:2000'],
            'tags'        => ['nullable', 'array'],
        ]);
        $workflow->fill($data);
        $workflow->save();

        $this->audit->record(
            workspaceId: $workflow->workspace_id,
            actorId: $request->user()->id,
            actorType: 'user',
            action: 'workflow.update',
            targetType: 'workflow',
            targetId: $workflow->id,
            meta: $data,
        );

        return response()->json($this->present($workflow));
    }

    public function destroy(Request $request, Workflow $workflow): JsonResponse
    {
        $this->authorize('workflow.delete', $workflow);
        $workflow->update(['status' => 'archived']);

        $this->audit->record(
            workspaceId: $workflow->workspace_id,
            actorId: $request->user()->id,
            actorType: 'user',
            action: 'workflow.archive',
            targetType: 'workflow',
            targetId: $workflow->id,
            meta: null,
        );
        return response()->json(['ok' => true]);
    }

    /** POST /v1/workflows/{id}/versions */
    public function saveVersion(Request $request, Workflow $workflow): JsonResponse
    {
        $this->authorize('workflow.edit', $workflow);

        $data = $request->validate([
            'graph'            => ['required', 'array'],
            'graph.nodes'      => ['nullable', 'array'],
            'graph.edges'      => ['nullable', 'array'],
            'langgraph_config' => ['nullable', 'array'],
        ]);

        $version = $this->workflows->saveVersion(
            workflow: $workflow,
            actor: $request->user(),
            graph: $data['graph'],
            langgraphConfig: $data['langgraph_config'] ?? null,
        );

        return response()->json([
            'id'      => $version->id,
            'version' => $version->version,
            'hash'    => $version->hash,
            'created_at' => $version->created_at?->toIso8601String(),
        ], 201);
    }

    /** GET /v1/workflows/{id}/versions */
    public function listVersions(Request $request, Workflow $workflow): JsonResponse
    {
        $this->authorize('workflow.view', $workflow);

        $rows = $workflow->versions()->take(50)->get()->map(fn ($v) => [
            'id'         => $v->id,
            'version'    => $v->version,
            'hash'       => $v->hash,
            'created_at' => $v->created_at?->toIso8601String(),
        ]);
        return response()->json(['data' => $rows]);
    }

    /** POST /v1/workflows/{id}/promote */
    public function promote(Request $request, Workflow $workflow): JsonResponse
    {
        $this->authorize('workflow.edit', $workflow);
        $data = $request->validate([
            'environment' => ['required', 'string', 'in:draft,staging,production'],
        ]);
        $workflow = $this->workflows->promote($workflow, $request->user(), $data['environment']);
        return response()->json($this->present($workflow));
    }

    protected function present(Workflow $w): array
    {
        return [
            'id'                  => $w->id,
            'workspace_id'        => $w->workspace_id,
            'name'                => $w->name,
            'description'         => $w->description,
            'status'              => $w->status,
            'environment'         => $w->environment,
            'tags'                => $w->tags ?? [],
            'current_version_id'  => $w->current_version_id,
            'current_version'     => $w->relationLoaded('currentVersion') ? [
                'id'      => $w->currentVersion?->id,
                'version' => $w->currentVersion?->version,
                'hash'    => $w->currentVersion?->hash,
                'graph'   => $w->currentVersion?->graph,
            ] : null,
            'created_by'          => $w->created_by,
            'created_at'          => $w->created_at?->toIso8601String(),
            'updated_at'          => $w->updated_at?->toIso8601String(),
        ];
    }
}
