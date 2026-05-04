<?php

namespace App\Services\Planner;

use App\Models\Workspace;

/**
 * F07 — NL → workflow draft (structured output). LLM + tool-calling wiring
 * lands in a later iteration; this service returns a schema-valid skeleton
 * the designer UI can refine.
 */
class WorkflowPlannerService
{
    /**
     * @return array{graph: array<string, mixed>, rationale: string, estimated_cost_credits: float}
     */
    public function generate(string $prompt, Workspace $workspace, ?string $seedWorkflowName = null): array
    {
        $name = $seedWorkflowName ?: 'Generated · '.substr(sha1($prompt), 0, 8);

        $graph = [
            'schema_version' => '1.0',
            'name'           => $name,
            'variables'      => ['prompt' => $prompt],
            'nodes'          => [
                ['id' => 'start', 'type' => 'trigger.manual', 'config' => []],
                ['id' => 'plan',  'type' => 'langgraph.agent', 'config' => ['agent_type' => 'planner', 'prompt' => $prompt]],
                ['id' => 'end',   'type' => 'noop', 'config' => []],
            ],
            'edges' => [
                ['from' => 'start', 'to' => 'plan'],
                ['from' => 'plan', 'to' => 'end'],
            ],
            'policies' => [
                'on_error'            => 'self_heal',
                'max_runtime_seconds' => 900,
            ],
        ];

        return [
            'graph'                    => $graph,
            'rationale'                => 'Stub planner (Phase 2): deterministic graph scaffold from prompt length '.strlen($prompt).' in workspace '.$workspace->slug.'.',
            'estimated_cost_credits'   => 0.25,
        ];
    }
}
