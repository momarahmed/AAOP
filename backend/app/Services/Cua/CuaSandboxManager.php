<?php

namespace App\Services\Cua;

/**
 * F08 — CUA / vision runtime façade. trycua/cua integration replaces this stub.
 *
 * @see https://github.com/trycua/cua
 */
class CuaSandboxManager
{
    /** @return array{status: string, latency_ms: int|null, image: string|null} */
    public function status(): array
    {
        return [
            'status'     => getenv('CUA_ENABLED') === '1' ? 'ready' : 'stub',
            'latency_ms' => null,
            'image'      => getenv('CUA_SANDBOX_IMAGE') ?: 'linux-chrome:latest',
        ];
    }

    /** @return array{session_id: string, endpoint: string|null} */
    public function createSession(string $workspaceId): array
    {
        return [
            'session_id' => 'cua-stub-'.substr(sha1($workspaceId . now()->toIso8601String()), 0, 16),
            'endpoint'   => null,
        ];
    }

    public function destroySession(string $sessionId): void
    {
        // no-op stub
    }
}
