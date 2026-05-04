<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Secret reference — never stores the value. The `vault_ref` column is a
 * vault path (e.g. `kv/data/workspaces/<id>/<name>`) which is resolved at
 * run time by the secrets broker.
 */
class Secret extends Model
{
    use HasUuid;

    protected $fillable = ['workspace_id', 'name', 'vault_ref', 'rotation_policy', 'metadata', 'created_by'];

    protected function casts(): array
    {
        return ['metadata' => 'array'];
    }

    /** @return BelongsTo<Workspace> */
    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }
}
