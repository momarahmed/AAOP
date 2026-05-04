<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UiMapping extends Model
{
    use HasUuid;

    protected $table = 'ui_mappings';

    protected $fillable = [
        'workspace_id', 'app_url', 'page_signature', 'element_label',
        'selector', 'source', 'bbox', 'confidence', 'observed_count',
        'vector_embedding', 'last_seen_at', 'last_heal_at',
    ];

    protected function casts(): array
    {
        return [
            'bbox'             => 'array',
            'vector_embedding' => 'array',
            'confidence'       => 'float',
            'observed_count'   => 'integer',
            'last_seen_at'     => 'datetime',
            'last_heal_at'     => 'datetime',
        ];
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }
}
