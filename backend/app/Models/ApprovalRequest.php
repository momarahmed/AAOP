<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ApprovalRequest extends Model
{
    use HasUuid;

    protected $fillable = [
        'workspace_id', 'run_id', 'node_id', 'risk_class',
        'required_approvers', 'status', 'sla_deadline', 'context',
        'created_by', 'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'context'      => 'array',
            'sla_deadline' => 'datetime',
            'resolved_at'  => 'datetime',
        ];
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

    /** @return HasMany<ApprovalDecision> */
    public function decisions(): HasMany
    {
        return $this->hasMany(ApprovalDecision::class, 'request_id');
    }
}
