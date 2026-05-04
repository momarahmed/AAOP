<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\DB;

/**
 * Append-only, hash-chained audit logger (PRD §17.6 FR-F4, §22.2).
 *
 * Each entry's `hash_chain` is `sha256(prev_hash || canonical_payload || secret)`.
 * The chain root is `0` and the secret comes from `config('app.aaop.audit_hash_secret')`.
 * Tampering with any historical row invalidates every subsequent hash.
 */
class AuditLogger
{
    /** @param array<string, mixed>|null $meta */
    public function record(
        ?string $workspaceId,
        ?string $actorId,
        string $actorType,
        string $action,
        ?string $targetType,
        ?string $targetId,
        ?array $meta = null,
    ): AuditLog {
        return DB::transaction(function () use ($workspaceId, $actorId, $actorType, $action, $targetType, $targetId, $meta) {

            $previousHash = AuditLog::query()
                ->orderByDesc('id')
                ->lockForUpdate()
                ->value('hash_chain') ?? str_repeat('0', 64);

            $payload = [
                'workspace_id' => $workspaceId,
                'actor_id'     => $actorId,
                'actor_type'   => $actorType,
                'action'       => $action,
                'target_type'  => $targetType,
                'target_id'    => $targetId,
                'meta'         => $meta,
                'created_at'   => now()->toIso8601String(),
            ];

            $canonical = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            $secret    = (string) config('app.aaop.audit_hash_secret');
            $chain     = hash('sha256', $previousHash.'|'.$canonical.'|'.$secret);

            return AuditLog::query()->create([
                'workspace_id' => $workspaceId,
                'actor_id'     => $actorId,
                'actor_type'   => $actorType,
                'action'       => $action,
                'target_type'  => $targetType,
                'target_id'    => $targetId,
                'meta'         => $meta,
                'hash_chain'   => $chain,
                'created_at'   => now(),
            ]);
        });
    }
}
