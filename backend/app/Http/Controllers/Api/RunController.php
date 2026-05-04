<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\ExecuteWorkflowRun;
use App\Models\Run;
use App\Models\Workflow;
use App\Models\Workspace;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Run lifecycle endpoints (PRD §17.2 FR-B1, §20.3).
 *
 * Real execution dispatch (FR-B11, T-F06-13) lands in Phase 2/3 — this
 * controller currently records the run intent + emits audit/events so the
 * SPA's Run Console can render the queue + transitions end-to-end.
 */
class RunController extends Controller
{
    public function __construct(private readonly AuditLogger $audit)
    {
    }

    public function index(Request $request, Workflow $workflow): JsonResponse
    {
        $this->authorize('workflow.view', $workflow);

        $rows = $workflow->runs()
            ->orderByDesc('created_at')
            ->take(50)
            ->get()
            ->map(fn (Run $r) => $this->present($r));

        return response()->json(['data' => $rows]);
    }

    public function start(Request $request, Workflow $workflow): JsonResponse
    {
        $this->authorize('workflow.run', $workflow);

        $data = $request->validate([
            'trigger'          => ['nullable', 'string', 'in:manual,schedule,webhook,api'],
            'execution_mode'   => ['nullable', 'string', 'in:test,staging,production'],
            'preferred_engine' => ['nullable', 'string', 'in:auto,dom,vision,mcp'],
            'inputs'           => ['nullable', 'array'],
        ]);

        if (! $workflow->current_version_id) {
            return response()->json([
                'error' => [
                    'code' => 'no_version',
                    'message' => 'Workflow has no saved version yet.',
                    'type' => 'validation_error',
                ],
            ], 422);
        }

        /** @var Workspace $workspace */
        $workspace = $request->attributes->get('workspace');

        $run = Run::query()->create([
            'workspace_id'     => $workspace->id,
            'workflow_id'      => $workflow->id,
            'version_id'       => $workflow->current_version_id,
            'status'           => Run::STATUS_QUEUED,
            'trigger'          => $data['trigger'] ?? 'manual',
            'environment'      => $data['execution_mode'] ?? $workflow->environment,
            'preferred_engine' => $data['preferred_engine'] ?? 'auto',
            'inputs'           => $data['inputs'] ?? null,
            'correlation_id'   => $request->attributes->get('correlation_id'),
            'triggered_by'     => $request->user()->id,
        ]);

        $this->audit->record(
            workspaceId: $workspace->id,
            actorId: $request->user()->id,
            actorType: 'user',
            action: 'run.start',
            targetType: 'run',
            targetId: $run->id,
            meta: ['workflow_id' => $workflow->id, 'trigger' => $run->trigger],
        );

        ExecuteWorkflowRun::dispatch($run->id);

        return response()->json([
            'run_id'     => $run->id,
            'status'     => $run->status,
            // Same-origin relative URL so the SPA works behind any host port.
            'stream_url' => '/api/v1/runs/'.$run->id.'/stream',
        ], 202);
    }

    /**
     * SSE stub for live run events (T-F04-08 scaffold). Full WebSocket/SSE
     * fan-out lands in Phase 3.
     */
    public function stream(Request $request, Run $run): StreamedResponse
    {
        /** @var Workspace $workspace */
        $workspace = $request->attributes->get('workspace');
        if ($run->workflow->workspace_id !== $workspace->id) {
            abort(404);
        }
        $this->authorize('workflow.view', $run->workflow);

        return response()->stream(function () use ($run) {
            echo "event: meta\n";
            echo 'data: '.json_encode([
                'run_id' => $run->id,
                'status' => $run->fresh()->status,
                'phase'  => 'sse_stub',
            ], JSON_THROW_ON_ERROR)."\n\n";
            if (function_exists('ob_flush')) {
                @ob_flush();
            }
            flush();
        }, 200, [
            'Content-Type'      => 'text/event-stream',
            'Cache-Control'     => 'no-cache',
            'Connection'        => 'keep-alive',
            'X-Accel-Buffering' => 'no',
        ]);
    }

    public function show(Request $request, Run $run): JsonResponse
    {
        $this->authorize('workflow.view', $run->workflow);
        $run->load('nodeRuns');
        return response()->json($this->present($run, withNodes: true));
    }

    public function cancel(Request $request, Run $run): JsonResponse
    {
        $this->authorize('workflow.run', $run->workflow);
        if (! in_array($run->status, [Run::STATUS_QUEUED, Run::STATUS_RUNNING, Run::STATUS_PAUSED, Run::STATUS_AWAITING_APPROVAL], true)) {
            return response()->json([
                'error' => [
                    'code' => 'invalid_state',
                    'message' => 'Run cannot be cancelled from its current state.',
                    'type' => 'conflict',
                    'details' => ['status' => $run->status],
                ],
            ], 409);
        }
        $run->update(['status' => Run::STATUS_CANCELLED, 'finished_at' => now()]);

        $this->audit->record(
            workspaceId: $run->workspace_id,
            actorId: $request->user()->id,
            actorType: 'user',
            action: 'run.cancel',
            targetType: 'run',
            targetId: $run->id,
            meta: null,
        );
        return response()->json($this->present($run->fresh()));
    }

    protected function present(Run $r, bool $withNodes = false): array
    {
        return [
            'id'                => $r->id,
            'workflow_id'       => $r->workflow_id,
            'version_id'        => $r->version_id,
            'status'            => $r->status,
            'trigger'           => $r->trigger,
            'environment'       => $r->environment,
            'preferred_engine'  => $r->preferred_engine,
            'started_at'        => $r->started_at?->toIso8601String(),
            'finished_at'       => $r->finished_at?->toIso8601String(),
            'duration_ms'       => $r->duration_ms,
            'cost_credits'      => (float) $r->cost_credits,
            'error'             => $r->error,
            'correlation_id'    => $r->correlation_id,
            'created_at'        => $r->created_at?->toIso8601String(),
            'node_runs'         => $withNodes ? $r->nodeRuns->map(fn ($n) => [
                'id' => $n->id, 'node_id' => $n->node_id, 'engine' => $n->engine,
                'status' => $n->status, 'attempt' => $n->attempt,
                'started_at' => $n->started_at?->toIso8601String(),
                'finished_at' => $n->finished_at?->toIso8601String(),
                'healed' => (bool) $n->healed,
                'error' => $n->error,
            ])->all() : null,
        ];
    }
}
