<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkflowVersion extends Model
{
    use HasFactory;
    use HasUuid;

    protected $fillable = [
        'workflow_id',
        'version',
        'graph',
        'langgraph_config',
        'hash',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'graph'            => 'array',
            'langgraph_config' => 'array',
            'version'          => 'integer',
        ];
    }

    /** @return BelongsTo<Workflow> */
    public function workflow(): BelongsTo
    {
        return $this->belongsTo(Workflow::class);
    }

    /** @return BelongsTo<User> */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
