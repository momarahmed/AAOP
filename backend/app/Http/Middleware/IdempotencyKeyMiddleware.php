<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

/**
 * `Idempotency-Key` handling for unsafe verbs (PRD §20.1, T-F04-03).
 *
 * - 24h TTL.
 * - Same key + same body → cached response replayed.
 * - Same key + different body → 409 Conflict.
 * - Missing key → request proceeds without idempotency tracking.
 *
 * Cache scope is per-token to prevent cross-tenant collisions.
 */
class IdempotencyKeyMiddleware
{
    public const HEADER = 'Idempotency-Key';
    public const TTL = 86400; // 24h

    public function handle(Request $request, Closure $next): Response
    {
        // Only meaningful for state-changing verbs.
        if (! in_array(strtoupper($request->method()), ['POST', 'PATCH', 'PUT', 'DELETE'], true)) {
            return $next($request);
        }

        $key = trim((string) $request->headers->get(self::HEADER, ''));
        if ($key === '') {
            return $next($request);
        }

        if (strlen($key) > 64) {
            return response()->json([
                'error' => [
                    'code' => 'invalid_idempotency_key',
                    'message' => 'Idempotency-Key must be ≤ 64 chars.',
                    'type' => 'validation_error',
                ],
            ], 400);
        }

        $userId = optional($request->user())->id ?? 'anon';
        $cacheKey = "aaop:idempotency:{$userId}:{$key}";
        $bodyHash = sha1((string) $request->getContent());

        $existing = Cache::get($cacheKey);
        if ($existing !== null) {
            if (($existing['body_hash'] ?? null) !== $bodyHash) {
                return response()->json([
                    'error' => [
                        'code' => 'idempotency_conflict',
                        'message' => 'Idempotency-Key reused with a different request body.',
                        'type' => 'conflict',
                    ],
                ], 409);
            }
            $resp = response()->json($existing['payload'], $existing['status']);
            $resp->headers->set(self::HEADER, $key);
            $resp->headers->set('Idempotent-Replay', 'true');
            return $resp;
        }

        /** @var Response $response */
        $response = $next($request);

        if ($response instanceof JsonResponse && $response->getStatusCode() < 500) {
            Cache::put($cacheKey, [
                'body_hash' => $bodyHash,
                'payload'   => $response->getData(true),
                'status'    => $response->getStatusCode(),
                'stored_at' => now()->toIso8601String(),
            ], self::TTL);
            $response->headers->set(self::HEADER, $key);
        }

        return $response;
    }
}
