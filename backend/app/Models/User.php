<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens;
    use HasFactory;
    use HasUuid;
    use Notifiable;

    protected $fillable = [
        'email',
        'display_name',
        'hashed_password',
        'is_admin',
        'mfa_enabled',
        'mfa_secret',
        'default_workspace_id',
        'last_seen_at',
        'email_verified_at',
    ];

    protected $hidden = [
        'hashed_password',
        'mfa_secret',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'is_admin'          => 'boolean',
            'mfa_enabled'       => 'boolean',
            'email_verified_at' => 'datetime',
            'last_seen_at'      => 'datetime',
        ];
    }

    public function getAuthPassword(): string
    {
        return $this->hashed_password;
    }

    /** @return BelongsToMany<Workspace> */
    public function workspaces(): BelongsToMany
    {
        return $this->belongsToMany(Workspace::class, 'memberships')
            ->withPivot('role')
            ->withTimestamps();
    }

    /** @return HasMany<Membership> */
    public function memberships(): HasMany
    {
        return $this->hasMany(Membership::class, 'user_id');
    }

    public function defaultWorkspace(): ?Workspace
    {
        return $this->default_workspace_id
            ? Workspace::query()->find($this->default_workspace_id)
            : $this->workspaces()->first();
    }

    /** @return HasMany<WebauthnCredential> */
    public function webauthnCredentials(): HasMany
    {
        return $this->hasMany(WebauthnCredential::class, 'user_id');
    }

    /** @return HasMany<OauthIdentity> */
    public function oauthIdentities(): HasMany
    {
        return $this->hasMany(OauthIdentity::class, 'user_id');
    }
}
