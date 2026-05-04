<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Policy extends Model
{
    use HasUuid;

    protected $fillable = [
        'workspace_id', 'name', 'scope', 'scope_id',
        'rego', 'schema', 'enforced_at', 'version', 'enabled', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'schema'       => 'array',
            'enforced_at'  => 'array',
            'enabled'      => 'boolean',
            'version'      => 'integer',
        ];
    }

    /** @return BelongsTo<Workspace> */
    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }
}
