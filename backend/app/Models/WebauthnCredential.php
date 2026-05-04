<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WebauthnCredential extends Model
{
    use HasUuid;

    protected $table = 'webauthn_credentials';

    protected $fillable = [
        'user_id', 'credential_id', 'public_key', 'counter',
        'aaguid', 'transports', 'attestation_format', 'label', 'last_used_at',
    ];

    protected function casts(): array
    {
        return [
            'transports'   => 'array',
            'counter'      => 'integer',
            'last_used_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
