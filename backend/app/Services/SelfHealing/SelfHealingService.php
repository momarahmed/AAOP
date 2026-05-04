<?php

namespace App\Services\SelfHealing;

use App\Models\HealAttempt;
use App\Models\Workspace;
use App\Services\AuditLogger;

/** F10 — record heal attempts for tracing / learning loop (scaffold). */
final class SelfHealingService
{
    public function __construct(private readonly AuditLogger $audit) {}

    /**
     * @param  array<string, mixed>|null  $meta
     */
    public function record(
        Workspace $workspace,
        string $failureSignal,
        string $strategy,
        string $status = 'attempted',
        ?string $runId = null,
        ?string $nodeRunId = null,
        ?array $meta = null,
    ): HealAttempt {
        $row = HealAttempt::query()->create([
            'workspace_id'    => $workspace->id,
            'run_id'          => $runId,
            'node_run_id'     => $nodeRunId,
            'failure_signal'  => $failureSignal,
            'strategy'        => $strategy,
            'status'          => $status,
            'meta'            => $meta,
        ]);

        $this->audit->record(
            workspaceId: $workspace->id,
            actorId: null,
            actorType: 'system',
            action: 'self_heal.attempt',
            targetType: 'heal_attempt',
            targetId: $row->id,
            meta: ['strategy' => $strategy, 'failure_signal' => $failureSignal, 'status' => $status],
        );

        return $row;
    }

    /** Ordered recovery strategies (PRD EC-15 circuit breaker hooks land in workers). */
    public function defaultStrategyChain(): array
    {
        return [
            ['strategy' => 'retry', 'description' => 'Immediate bounded retry'],
            ['strategy' => 'healenium', 'description' => 'ML selector remap'],
            ['strategy' => 'vision', 'description' => 'Visual locator recovery'],
            ['strategy' => 'wait', 'description' => 'Backoff / modal settle'],
            ['strategy' => 'replan', 'description' => 'Planner escalation'],
            ['strategy' => 'human', 'description' => 'HITL pause'],
        ];
    }
}
