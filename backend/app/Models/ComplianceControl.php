<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ComplianceControl extends Model
{
    use HasUuid;

    protected $fillable = [
        'framework', 'control_id', 'title', 'description', 'mappings', 'default_status',
    ];

    protected function casts(): array
    {
        return [
            'mappings' => 'array',
        ];
    }

    /** @return HasMany<ComplianceAttestation> */
    public function attestations(): HasMany
    {
        return $this->hasMany(ComplianceAttestation::class, 'control_id');
    }
}
