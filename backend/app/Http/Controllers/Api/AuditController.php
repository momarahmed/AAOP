<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Crypt;

/**
 * Audit log query + signed export bundle (PRD §17.6 FR-F4 / T-F04-14, T-F12-08).
 *
 * The signed bundle is a compact JSON document hashed and signed using the
 * application key — sufficient for v1 GA. Production deployments will
 * upgrade to detached Cosign signatures + customer-supplied verification
 * keys (PRD §22.2 supply chain controls).
 */
class AuditController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        /** @var Workspace $workspace */
        $workspace = $request->attributes->get('workspace');
        $this->authorize('workspace.manage', $workspace);

        $cursor = $request->query('cursor');
        $limit  = (int) min(max((int) $request->query('limit', 50), 1), 200);

        $q = AuditLog::query()->where('workspace_id', $workspace->id)->orderByDesc('id');
        if ($action = $request->query('action')) {
            $q->where('action', $action);
        }
        if ($from = $request->query('from')) {
            $q->where('created_at', '>=', $from);
        }
        if ($to = $request->query('to')) {
            $q->where('created_at', '<=', $to);
        }

        $page = $q->cursorPaginate($limit, ['*'], 'cursor', $cursor);

        return response()->json([
            'data' => collect($page->items())->map(fn (AuditLog $l) => [
                'id'          => $l->id,
                'workspace_id' => $l->workspace_id,
                'actor_id'    => $l->actor_id,
                'actor_type'  => $l->actor_type,
                'action'      => $l->action,
                'target_type' => $l->target_type,
                'target_id'   => $l->target_id,
                'meta'        => $l->meta,
                'hash_chain'  => $l->hash_chain,
                'created_at'  => $l->created_at?->toIso8601String(),
            ]),
            'next_cursor' => $page->nextCursor()?->encode(),
        ]);
    }

    public function export(Request $request): Response
    {
        /** @var Workspace $workspace */
        $workspace = $request->attributes->get('workspace');
        $this->authorize('workspace.manage', $workspace);

        $from = $request->query('from');
        $to   = $request->query('to');

        $q = AuditLog::query()->where('workspace_id', $workspace->id)->orderBy('id');
        if ($from) $q->where('created_at', '>=', $from);
        if ($to)   $q->where('created_at', '<=', $to);

        $rows = $q->get()->map(fn (AuditLog $l) => [
            'id' => $l->id,
            'workspace_id' => $l->workspace_id,
            'actor_id' => $l->actor_id,
            'actor_type' => $l->actor_type,
            'action' => $l->action,
            'target_type' => $l->target_type,
            'target_id' => $l->target_id,
            'meta' => $l->meta,
            'hash_chain' => $l->hash_chain,
            'created_at' => $l->created_at?->toIso8601String(),
        ])->toArray();

        $bundle = [
            'workspace_id' => $workspace->id,
            'workspace_name' => $workspace->name,
            'exported_at' => now()->toIso8601String(),
            'exported_by' => $request->user()->id,
            'count' => count($rows),
            'records' => $rows,
        ];

        $payload = json_encode($bundle, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        $signature = Crypt::encryptString(hash('sha256', $payload));

        $body = json_encode([
            'bundle' => $bundle,
            'signature' => $signature,
            'algorithm' => 'sha256+laravel-encrypter',
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

        $filename = 'audit-'.$workspace->slug.'-'.now()->format('Ymd-His').'.json';
        return response($body, 200, [
            'Content-Type' => 'application/json',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ]);
    }
}
