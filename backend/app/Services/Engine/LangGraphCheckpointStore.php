<?php

namespace App\Services\Engine;

use App\Models\LangGraphCheckpoint;
use App\Models\Run;

/**
 * Checkpointer backing store — maps to `langgraph_checkpoints` (MySQL).
 * LangGraph Python runtime can be bridged later; this layer is the contract.
 */
class LangGraphCheckpointStore
{
    public function save(Run $run, string $threadId, string $checkpointId, array $state): LangGraphCheckpoint
    {
        return LangGraphCheckpoint::query()->create([
            'run_id'         => $run->id,
            'thread_id'      => $threadId,
            'checkpoint_id'  => $checkpointId,
            'state'          => $state,
        ]);
    }

    public function latest(Run $run, string $threadId): ?LangGraphCheckpoint
    {
        return LangGraphCheckpoint::query()
            ->where('run_id', $run->id)
            ->where('thread_id', $threadId)
            ->orderByDesc('created_at')
            ->first();
    }
}
