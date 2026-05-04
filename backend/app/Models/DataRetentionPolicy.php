<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DataRetentionPolicy extends Model
{
    use HasUuid;

    protected $fillable = [
        'workspace_id', 'data_class', 'retention_days', 'legal_hold',
        'justification', 'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'retention_days' => 'integer',
            'legal_hold'     => 'boolean',
            'justification'  => 'array',
        ];
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }
}
