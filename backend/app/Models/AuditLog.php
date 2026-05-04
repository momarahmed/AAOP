<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Append-only audit log entry. Never updated or deleted in normal flow.
 * The `hash_chain` column links each entry to the previous one for
 * tamper-evidence (PRD §17.6 FR-F4 / T-F12-07).
 */
class AuditLog extends Model
{
    protected $table = 'audit_logs';
    public $timestamps = false;

    protected $fillable = [
        'workspace_id', 'actor_id', 'actor_type', 'action',
        'target_type', 'target_id', 'meta', 'hash_chain', 'created_at',
    ];

    protected function casts(): array
    {
        return [
            'meta'       => 'array',
            'created_at' => 'datetime',
        ];
    }
}
