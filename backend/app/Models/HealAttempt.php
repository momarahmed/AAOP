<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HealAttempt extends Model
{
    use HasUuid;

    protected $fillable = [
        'workspace_id', 'run_id', 'node_run_id',
        'failure_signal', 'strategy', 'status', 'meta',
    ];

    protected function casts(): array
    {
        return ['meta' => 'array'];
    }

    /** @return BelongsTo<Workspace> */
    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    /** @return BelongsTo<Run> */
    public function run(): BelongsTo
    {
        return $this->belongsTo(Run::class);
    }

    /** @return BelongsTo<NodeRun> */
    public function nodeRun(): BelongsTo
    {
        return $this->belongsTo(NodeRun::class, 'node_run_id');
    }
}
