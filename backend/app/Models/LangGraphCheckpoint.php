<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Persists LangGraph-compatible checkpoint blobs (T-F03-08 / PRD §19.2).
 */
class LangGraphCheckpoint extends Model
{
    use HasUuid;

    protected $table = 'langgraph_checkpoints';

    protected $fillable = [
        'run_id',
        'checkpoint_id',
        'thread_id',
        'state',
    ];

    protected function casts(): array
    {
        return [
            'state' => 'array',
        ];
    }

    /** @return BelongsTo<Run> */
    public function run(): BelongsTo
    {
        return $this->belongsTo(Run::class, 'run_id');
    }
}
