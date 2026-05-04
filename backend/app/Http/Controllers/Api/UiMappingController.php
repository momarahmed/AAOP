<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UiMapping;
use App\Models\Workspace;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * UI Mapping store API (Phase 4-5 / FR-D learning loop).
 *
 *   GET  /v1/ui-mappings              — list (filter by app_url, label)
 *   POST /v1/ui-mappings              — upsert (workspace, app_url, element_label)
 */
class UiMappingController extends Controller
{
    public function __construct(private readonly AuditLogger $audit)
    {
    }

    public function index(Request $request): JsonResponse
    {
        /** @var Workspace $workspace */
        $workspace = $request->attributes->get('workspace');

        $q = UiMapping::query()
            ->where('workspace_id', $workspace->id)
            ->orderByDesc('observed_count');

        if ($url = $request->query('app_url')) {
            $q->where('app_url', $url);
        }
        if ($label = $request->query('element_label')) {
            $q->where('element_label', 'like', '%'.$label.'%');
        }
        $limit = (int) min(max((int) $request->query('limit', 100), 1), 500);

        return response()->json([
            'data'  => $q->take($limit)->get()->map(fn (UiMapping $u) => $this->present($u)),
            'limit' => $limit,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        /** @var Workspace $workspace */
        $workspace = $request->attributes->get('workspace');

        $data = $request->validate([
            'app_url'         => ['required', 'string', 'max:512'],
            'page_signature'  => ['nullable', 'string', 'max:64'],
            'element_label'   => ['required', 'string', 'max:255'],
            'selector'        => ['nullable', 'string'],
            'source'          => ['nullable', 'string', 'in:observed,heal,seed,manual'],
            'bbox'            => ['nullable', 'array'],
            'confidence'      => ['nullable', 'numeric', 'between:0,1'],
            'vector_embedding'=> ['nullable', 'array'],
        ]);

        $existing = UiMapping::query()
            ->where('workspace_id', $workspace->id)
            ->where('app_url', $data['app_url'])
            ->where('element_label', $data['element_label'])
            ->first();

        if ($existing) {
            $existing->fill([
                'page_signature'   => $data['page_signature'] ?? $existing->page_signature,
                'selector'         => $data['selector'] ?? $existing->selector,
                'source'           => $data['source'] ?? $existing->source,
                'bbox'             => $data['bbox'] ?? $existing->bbox,
                'confidence'       => $data['confidence'] ?? $existing->confidence,
                'vector_embedding' => $data['vector_embedding'] ?? $existing->vector_embedding,
                'last_seen_at'     => now(),
            ]);
            $existing->observed_count = (int) $existing->observed_count + 1;
            if (($data['source'] ?? null) === 'heal') {
                $existing->last_heal_at = now();
            }
            $existing->save();
            $mapping = $existing;
            $created = false;
        } else {
            $mapping = UiMapping::query()->create([
                'workspace_id'     => $workspace->id,
                'app_url'          => $data['app_url'],
                'page_signature'   => $data['page_signature'] ?? null,
                'element_label'    => $data['element_label'],
                'selector'         => $data['selector'] ?? null,
                'source'           => $data['source'] ?? 'observed',
                'bbox'             => $data['bbox'] ?? null,
                'confidence'       => $data['confidence'] ?? null,
                'vector_embedding' => $data['vector_embedding'] ?? null,
                'observed_count'   => 1,
                'last_seen_at'     => now(),
                'last_heal_at'     => ($data['source'] ?? null) === 'heal' ? now() : null,
            ]);
            $created = true;
        }

        $this->audit->record(
            workspaceId: $workspace->id,
            actorId: $request->user()->id,
            actorType: 'user',
            action: $created ? 'ui_mapping.create' : 'ui_mapping.update',
            targetType: 'ui_mapping',
            targetId: $mapping->id,
            meta: ['app_url' => $mapping->app_url, 'element_label' => $mapping->element_label],
        );

        return response()->json($this->present($mapping), $created ? 201 : 200);
    }

    protected function present(UiMapping $u): array
    {
        return [
            'id'              => $u->id,
            'app_url'         => $u->app_url,
            'page_signature'  => $u->page_signature,
            'element_label'   => $u->element_label,
            'selector'        => $u->selector,
            'source'          => $u->source,
            'bbox'            => $u->bbox,
            'confidence'      => $u->confidence,
            'observed_count'  => $u->observed_count,
            'last_seen_at'    => $u->last_seen_at?->toIso8601String(),
            'last_heal_at'    => $u->last_heal_at?->toIso8601String(),
        ];
    }
}
