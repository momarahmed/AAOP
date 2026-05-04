<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NodeRun extends Model
{
    use HasFactory;
    use HasUuid;

    protected $fillable = [
        'run_id', 'node_id', 'engine', 'status', 'attempt',
        'input', 'output', 'error',
        'started_at', 'finished_at', 'duration_ms',
        'screenshot_url', 'healed', 'healenium_remap', 'heal_diff',
    ];

    protected function casts(): array
    {
        return [
            'input'           => 'array',
            'output'          => 'array',
            'heal_diff'       => 'array',
            'healed'          => 'boolean',
            'healenium_remap' => 'boolean',
            'started_at'      => 'datetime',
            'finished_at'     => 'datetime',
        ];
    }

    /** @return BelongsTo<Run> */
    public function run(): BelongsTo
    {
        return $this->belongsTo(Run::class);
    }
}
