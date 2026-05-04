<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OauthIdentity extends Model
{
    use HasUuid;

    protected $table = 'oauth_identities';

    public $timestamps = false;

    protected $fillable = [
        'user_id', 'provider', 'provider_user_id', 'email', 'claims',
        'linked_at', 'last_login_at',
    ];

    protected function casts(): array
    {
        return [
            'claims'        => 'array',
            'linked_at'     => 'datetime',
            'last_login_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
