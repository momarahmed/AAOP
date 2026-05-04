<?php

namespace App\Services\Mcp;

use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * F13 / MCP gateway — compliant tool discovery + invocation façade (T-F13-04).
 * When `AAOP_MCP_REMOTE_BASE` is set, forwards to an external MCP HTTP bridge.
 */
class McpGatewayService
{
    /** @return list<array{name: string, description: string}> */
    public function listTools(?string $remoteBase): array
    {
        $base = $remoteBase ?: (string) (config('services.mcp.remote_base') ?? '');

        if ($base !== '') {
            try {
                $res = Http::timeout(3)->get(rtrim($base, '/').'/tools');
                if ($res->successful()) {
                    $tools = $res->json('tools');
                    if (is_array($tools)) {
                        return $tools;
                    }
                }
            } catch (Throwable) {
            }
        }

        return [
            ['name' => 'aaop.echo', 'description' => 'Echo arguments (dev stub).'],
            ['name' => 'aaop.health', 'description' => 'Gateway liveness (dev stub).'],
        ];
    }

    /** @return array<string, mixed> */
    public function callTool(string $name, array $arguments, ?string $remoteBase): array
    {
        if ($name === 'aaop.health') {
            return ['ok' => true, 'gateway' => 'aaop-mcp-stub'];
        }
        if ($name === 'aaop.echo') {
            return ['echo' => $arguments];
        }

        $base = $remoteBase ?: (string) (config('services.mcp.remote_base') ?? '');
        if ($base !== '') {
            try {
                $res = Http::timeout(15)->post(rtrim($base, '/').'/call', [
                    'name'      => $name,
                    'arguments' => $arguments,
                ]);
                if ($res->successful()) {
                    return $res->json('result') ?? ['raw' => $res->body()];
                }

                return ['error' => 'upstream_error', 'status' => $res->status(), 'body' => $res->body()];
            } catch (Throwable $e) {
                return ['error' => 'upstream_exception', 'message' => $e->getMessage()];
            }
        }

        return ['error' => 'unknown_tool', 'name' => $name];
    }
}
