<?php

namespace App\Services\Orchestration;

use App\Models\Workflow;

/**
 * F09 — execution orchestrator (routing + canary slice).
 *
 * Canary assignment is deterministic from `(correlation_id · workflow_id)` so
 * retries and audits stay stable without sticky sessions.
 */
final class ExecutionOrchestratorService
{
    /**
     * @return array{version_id: string|null, lane: string, bucket: int, reason: string}
     */
    public function resolveRunVersion(Workflow $workflow, ?string $correlationId): array
    {
        $stableId = $workflow->current_version_id;
        $canaryId = $workflow->canary_version_id;
        $pct = min(100, max(0, (int) $workflow->canary_percent));

        if (! $stableId) {
            return ['version_id' => null, 'lane' => 'none', 'bucket' => -1, 'reason' => 'no_stable_version'];
        }

        if (! $canaryId || $pct <= 0) {
            return ['version_id' => $stableId, 'lane' => 'stable', 'bucket' => -1, 'reason' => 'canary_disabled'];
        }

        $salt = ($correlationId ?? '').'|'.$workflow->id;
        $bucket = hexdec(substr(sha1($salt), 0, 8)) % 100;

        if ($bucket < $pct) {
            return [
                'version_id' => $canaryId,
                'lane'       => 'canary',
                'bucket'     => $bucket,
                'reason'     => 'canary_rollout',
            ];
        }

        return [
            'version_id' => $stableId,
            'lane'       => 'stable',
            'bucket'     => $bucket,
            'reason'     => 'stable_rollout',
        ];
    }

    /**
     * FR-D1/D2 fallback ordering (scaffold — engines plug in behind workers).
     *
     * @return list<string>
     */
    public function fallbackChain(string $failureSignal): array
    {
        return match ($failureSignal) {
            'selector_not_found', 'dom_miss' => ['dom', 'healenium', 'vision', 'mcp', 'human'],
            'visual_fail', 'vision_miss' => ['vision', 'dom', 'mcp', 'human'],
            'timeout', 'modal_block' => ['retry', 'dom', 'vision', 'replan', 'human'],
            default => ['retry', 'dom', 'healenium', 'vision', 'replan', 'human'],
        };
    }

    /**
     * Pick primary engine from workflow preference + signal heuristics.
     *
     * @return array{primary: string, chain: list<string>}
     */
    public function routeDecision(string $preferredEngine, string $failureSignal): array
    {
        $chain = $this->fallbackChain($failureSignal);
        $primary = match ($preferredEngine) {
            'dom', 'vision', 'mcp' => $preferredEngine,
            default => $chain[0] ?? 'dom',
        };

        return ['primary' => $primary, 'chain' => $chain];
    }
}
