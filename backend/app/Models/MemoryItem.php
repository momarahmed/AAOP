<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Workspace-scoped memory store entry.
 * Kinds: episodic (run history), semantic (facts), procedural (recipes), preference (user prefs).
 */
class MemoryItem extends Model
{
    use HasUuid;

    protected $fillable = [
        'workspace_id', 'user_id', 'kind', 'namespace', 'key',
        'content', 'tags', 'vector_embedding', 'relevance', 'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'content'          => 'array',
            'tags'             => 'array',
            'vector_embedding' => 'array',
            'relevance'        => 'float',
            'expires_at'       => 'datetime',
        ];
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
