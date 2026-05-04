<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Workspace extends Model
{
    use HasFactory;
    use HasUuid;

    protected $fillable = ['name', 'slug', 'plan', 'region', 'settings'];

    protected function casts(): array
    {
        return ['settings' => 'array'];
    }

    /** @return BelongsToMany<User> */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'memberships')
            ->withPivot('role')
            ->withTimestamps();
    }

    /** @return HasMany<Membership> */
    public function memberships(): HasMany
    {
        return $this->hasMany(Membership::class, 'workspace_id');
    }

    /** @return HasMany<Workflow> */
    public function workflows(): HasMany
    {
        return $this->hasMany(Workflow::class, 'workspace_id');
    }

    /** @return HasMany<Run> */
    public function runs(): HasMany
    {
        return $this->hasMany(Run::class, 'workspace_id');
    }

    /**
     * Returns the role string ('owner' | 'admin' | 'editor' | 'runner' | 'viewer')
     * for the given user, or null if they are not a member.
     */
    public function roleFor(?User $user): ?string
    {
        if (! $user) {
            return null;
        }
        return $this->memberships()
            ->where('user_id', $user->id)
            ->value('role');
    }
}
