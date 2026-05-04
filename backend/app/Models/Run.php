<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Run extends Model
{
    use HasFactory;
    use HasUuid;

    public const STATUS_QUEUED            = 'queued';
    public const STATUS_RUNNING           = 'running';
    public const STATUS_SUCCEEDED         = 'succeeded';
    public const STATUS_FAILED            = 'failed';
    public const STATUS_PAUSED            = 'paused';
    public const STATUS_CANCELLED         = 'cancelled';
    public const STATUS_AWAITING_APPROVAL = 'awaiting_approval';

    protected $fillable = [
        'workspace_id',
        'workflow_id',
        'version_id',
        'status',
        'trigger',
        'environment',
        'preferred_engine',
        'inputs',
        'outputs',
        'error',
        'cost_credits',
        'sandbox_id',
        'langgraph_checkpoint',
        'correlation_id',
        'triggered_by',
        'started_at',
        'finished_at',
        'duration_ms',
    ];

    protected function casts(): array
    {
        return [
            'inputs'       => 'array',
            'outputs'      => 'array',
            'cost_credits' => 'decimal:4',
            'started_at'   => 'datetime',
            'finished_at'  => 'datetime',
        ];
    }

    /** @return BelongsTo<Workspace> */
    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    /** @return BelongsTo<Workflow> */
    public function workflow(): BelongsTo
    {
        return $this->belongsTo(Workflow::class);
    }

    /** @return BelongsTo<WorkflowVersion> */
    public function version(): BelongsTo
    {
        return $this->belongsTo(WorkflowVersion::class, 'version_id');
    }

    /** @return BelongsTo<User> */
    public function trigger_user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'triggered_by');
    }

    /** @return HasMany<NodeRun> */
    public function nodeRuns(): HasMany
    {
        return $this->hasMany(NodeRun::class, 'run_id')->orderBy('started_at');
    }
}
