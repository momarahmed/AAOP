<?php

namespace App\Jobs;

use App\Models\NodeRun;
use App\Models\Run;
use App\Services\Engine\LangGraphCheckpointStore;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Str;
use Throwable;

/**
 * Phase 2 (F06) — executes a queued run with checkpoint persistence at
 * node boundaries. Real LangGraph / CUA sandboxes plug in behind this job.
 */
class ExecuteWorkflowRun implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(public string $runId) {}

    public function handle(LangGraphCheckpointStore $checkpoints): void
    {
        $run = Run::query()->with(['workflow', 'version'])->find($this->runId);
        if (! $run || $run->status === Run::STATUS_CANCELLED) {
            return;
        }

        try {
            $run->update([
                'status'      => Run::STATUS_RUNNING,
                'started_at'  => $run->started_at ?? now(),
            ]);

            $graph = $run->version?->graph ?? [];
            $nodes = $graph['nodes'] ?? [];
            $threadId = (string) ($run->version?->langgraph_config['thread_id'] ?? $run->id);

            $state = [
                'channel_values' => ['inputs' => $run->inputs ?? []],
                'step'           => 0,
            ];
            $cpId = (string) Str::uuid();
            $checkpoints->save($run, $threadId, $cpId, $state);
            $run->update(['langgraph_checkpoint' => $cpId]);

            $max = min(count($nodes), 25);
            for ($i = 0; $i < $max; $i++) {
                $node = $nodes[$i];
                $nodeId = $node['id'] ?? 'node_'.$i;
                $type = (string) ($node['type'] ?? 'noop');
                $engine = $this->engineForNodeType($type);

                $nr = NodeRun::query()->create([
                    'run_id'     => $run->id,
                    'node_id'    => $nodeId,
                    'engine'     => $engine,
                    'status'     => 'running',
                    'attempt'    => 1,
                    'input'      => ['type' => $type],
                    'started_at' => now(),
                ]);

                $state['step'] = $i + 1;
                $state['last_node'] = $nodeId;
                $cpId = (string) Str::uuid();
                $checkpoints->save($run, $threadId, $cpId, $state);

                $nr->update([
                    'status'       => 'succeeded',
                    'output'       => ['ok' => true, 'engine' => $engine],
                    'finished_at'  => now(),
                    'duration_ms'  => 1,
                ]);
            }

            $run->refresh();
            $started = $run->started_at ?? now();

            $run->update([
                'status'               => Run::STATUS_SUCCEEDED,
                'finished_at'          => now(),
                'outputs'              => [
                    'summary'      => 'Phase-2 stub execution completed.',
                    'nodes_touched'=> $max,
                ],
                'langgraph_checkpoint' => $cpId,
                'duration_ms'          => (int) $started->diffInMilliseconds(now()),
            ]);
        } catch (Throwable $e) {
            $run->update([
                'status'       => Run::STATUS_FAILED,
                'finished_at'  => now(),
                'error'        => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    private function engineForNodeType(string $type): string
    {
        return match (true) {
            str_contains($type, 'langgraph')     => 'langgraph',
            str_contains($type, 'vision')        => 'vision',
            str_contains($type, 'integration')   => 'activepieces',
            str_contains($type, 'mcp')           => 'mcp',
            default                               => 'dom',
        };
    }
}
