<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ComplianceAttestation extends Model
{
    use HasUuid;

    protected $fillable = [
        'workspace_id', 'control_id', 'status', 'notes', 'evidence',
        'attested_by', 'attested_at',
    ];

    protected function casts(): array
    {
        return [
            'evidence'    => 'array',
            'attested_at' => 'datetime',
        ];
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function control(): BelongsTo
    {
        return $this->belongsTo(ComplianceControl::class, 'control_id');
    }

    public function attester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'attested_by');
    }
}
