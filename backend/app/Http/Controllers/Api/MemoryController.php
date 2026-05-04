<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MemoryItem;
use App\Models\Workspace;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Memory store API (Phase 4-5).
 *
 *   GET    /v1/memory                  — list items in workspace (filter by kind/namespace/q)
 *   POST   /v1/memory                  — upsert an item (workspace, namespace, key)
 *   DELETE /v1/memory/{item}           — purge a single item
 */
class MemoryController extends Controller
{
    public function __construct(private readonly AuditLogger $audit)
    {
    }

    public function index(Request $request): JsonResponse
    {
        /** @var Workspace $workspace */
        $workspace = $request->attributes->get('workspace');

        $q = MemoryItem::query()
            ->where('workspace_id', $workspace->id)
            ->orderByDesc('updated_at');

        if ($kind = $request->query('kind')) {
            $q->where('kind', $kind);
        }
        if ($ns = $request->query('namespace')) {
            $q->where('namespace', $ns);
        }
        if ($search = trim((string) $request->query('q', ''))) {
            $q->where('key', 'like', '%'.$search.'%');
        }
        $limit = (int) min(max((int) $request->query('limit', 50), 1), 200);

        return response()->json([
            'data'  => $q->take($limit)->get()->map(fn (MemoryItem $m) => $this->present($m)),
            'limit' => $limit,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        /** @var Workspace $workspace */
        $workspace = $request->attributes->get('workspace');

        $data = $request->validate([
            'kind'             => ['required', 'string', 'in:episodic,semantic,procedural,preference'],
            'namespace'        => ['nullable', 'string', 'max:80'],
            'key'              => ['required', 'string', 'max:255'],
            'content'          => ['required', 'array'],
            'tags'             => ['nullable', 'array'],
            'tags.*'           => ['string', 'max:64'],
            'vector_embedding' => ['nullable', 'array'],
            'relevance'        => ['nullable', 'numeric', 'between:0,1'],
            'expires_at'       => ['nullable', 'date'],
        ]);

        $item = MemoryItem::query()->updateOrCreate(
            [
                'workspace_id' => $workspace->id,
                'namespace'    => $data['namespace'] ?? 'default',
                'key'          => $data['key'],
            ],
            [
                'user_id'          => $request->user()->id,
                'kind'             => $data['kind'],
                'content'          => $data['content'],
                'tags'             => $data['tags'] ?? null,
                'vector_embedding' => $data['vector_embedding'] ?? null,
                'relevance'        => $data['relevance'] ?? null,
                'expires_at'       => $data['expires_at'] ?? null,
            ]
        );

        $this->audit->record(
            workspaceId: $workspace->id,
            actorId: $request->user()->id,
            actorType: 'user',
            action: 'memory.upsert',
            targetType: 'memory_item',
            targetId: $item->id,
            meta: ['kind' => $item->kind, 'namespace' => $item->namespace, 'key' => $item->key],
        );

        return response()->json($this->present($item->refresh()), $item->wasRecentlyCreated ? 201 : 200);
    }

    public function destroy(Request $request, MemoryItem $memory): JsonResponse
    {
        /** @var Workspace $workspace */
        $workspace = $request->attributes->get('workspace');
        abort_unless($memory->workspace_id === $workspace->id, 404);

        $memory->delete();

        $this->audit->record(
            workspaceId: $workspace->id,
            actorId: $request->user()->id,
            actorType: 'user',
            action: 'memory.delete',
            targetType: 'memory_item',
            targetId: $memory->id,
            meta: null,
        );
        return response()->json(['ok' => true]);
    }

    protected function present(MemoryItem $m): array
    {
        return [
            'id'         => $m->id,
            'kind'       => $m->kind,
            'namespace'  => $m->namespace,
            'key'        => $m->key,
            'content'    => $m->content,
            'tags'       => $m->tags ?? [],
            'relevance'  => $m->relevance,
            'expires_at' => $m->expires_at?->toIso8601String(),
            'updated_at' => $m->updated_at?->toIso8601String(),
        ];
    }
}
