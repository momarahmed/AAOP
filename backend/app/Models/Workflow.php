<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Workflow extends Model
{
    use HasFactory;
    use HasUuid;

    protected $fillable = [
        'workspace_id',
        'name',
        'description',
        'current_version_id',
        'canary_percent',
        'canary_version_id',
        'status',
        'environment',
        'tags',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'tags'           => 'array',
            'canary_percent' => 'integer',
        ];
    }

    /** @return BelongsTo<Workspace> */
    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    /** @return BelongsTo<User> */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** @return BelongsTo<WorkflowVersion> */
    public function currentVersion(): BelongsTo
    {
        return $this->belongsTo(WorkflowVersion::class, 'current_version_id');
    }

    /** @return HasMany<WorkflowVersion> */
    public function versions(): HasMany
    {
        return $this->hasMany(WorkflowVersion::class, 'workflow_id')
            ->orderByDesc('version');
    }

    /** @return HasMany<Run> */
    public function runs(): HasMany
    {
        return $this->hasMany(Run::class, 'workflow_id');
    }

    /** @return HasMany<WorkflowAcl> */
    public function acls(): HasMany
    {
        return $this->hasMany(WorkflowAcl::class, 'workflow_id');
    }

    /**
     * Returns the explicit ACL permission for the given user on this
     * workflow, or null if no override exists.
     */
    public function aclFor(?User $user): ?string
    {
        if (! $user) {
            return null;
        }
        return $this->acls()->where('user_id', $user->id)->value('permission');
    }
}
