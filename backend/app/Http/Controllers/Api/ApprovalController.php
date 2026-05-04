<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ApprovalDecision;
use App\Models\ApprovalRequest;
use App\Models\Workspace;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Approval Center — pending requests + decision recording.
 * Implements the API surface of PRD §17.6 FR-F2 / T-F12-05.
 */
class ApprovalController extends Controller
{
    public function __construct(private readonly AuditLogger $audit)
    {
    }

    public function index(Request $request): JsonResponse
    {
        /** @var Workspace $workspace */
        $workspace = $request->attributes->get('workspace');

        $status = $request->query('status', 'pending');
        $rows = ApprovalRequest::query()
            ->where('workspace_id', $workspace->id)
            ->when($status, fn ($q) => $q->where('status', $status))
            ->orderBy('sla_deadline')
            ->take(100)
            ->get()
            ->map(fn (ApprovalRequest $a) => [
                'id'           => $a->id,
                'run_id'       => $a->run_id,
                'node_id'      => $a->node_id,
                'risk_class'   => $a->risk_class,
                'status'       => $a->status,
                'sla_deadline' => $a->sla_deadline?->toIso8601String(),
                'context'      => $a->context,
                'created_at'   => $a->created_at?->toIso8601String(),
            ]);

        return response()->json(['data' => $rows]);
    }

    public function decide(Request $request, ApprovalRequest $approval): JsonResponse
    {
        /** @var Workspace $workspace */
        $workspace = $request->attributes->get('workspace');
        if ($approval->workspace_id !== $workspace->id) {
            abort(404);
        }
        $this->authorize('workspace.view', $workspace);

        $data = $request->validate([
            'decision' => ['required', 'string', 'in:approved,rejected'],
            'reason'   => ['nullable', 'string', 'max:2000'],
        ]);

        ApprovalDecision::query()->create([
            'request_id'  => $approval->id,
            'approver_id' => $request->user()->id,
            'decision'    => $data['decision'],
            'reason'      => $data['reason'] ?? null,
        ]);

        $approval->update([
            'status'      => $data['decision'],
            'resolved_at' => now(),
        ]);

        $this->audit->record(
            workspaceId: $workspace->id,
            actorId: $request->user()->id,
            actorType: 'user',
            action: 'approval.decide',
            targetType: 'approval',
            targetId: $approval->id,
            meta: ['decision' => $data['decision'], 'reason' => $data['reason'] ?? null],
        );

        return response()->json(['ok' => true, 'status' => $approval->status]);
    }
}
