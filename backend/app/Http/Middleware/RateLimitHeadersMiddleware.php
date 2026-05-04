<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Cache\RateLimiter;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Lightweight per-token / per-IP rate limiter that emits the standard
 * `X-RateLimit-*` headers required by PRD §20.1 (T-F04-02).
 *
 * Limits are deliberately tight enough to surface client misuse during
 * development; production tuning lives behind the API gateway.
 */
class RateLimitHeadersMiddleware
{
    public const LIMIT_AUTH   = 600;   // requests / minute (authenticated)
    public const LIMIT_GUEST  = 120;   // requests / minute (unauthenticated)

    public function __construct(private readonly RateLimiter $limiter)
    {
    }

    public function handle(Request $request, Closure $next): Response
    {
        // Skip non-API surface.
        if (! $request->is('api/*')) {
            return $next($request);
        }

        [$key, $max] = $this->resolveBucket($request);
        $hits = $this->limiter->hit($key, 60);

        if ($hits > $max) {
            $retry = $this->limiter->availableIn($key);
            return response()->json([
                'error' => [
                    'code' => 'rate_limited',
                    'message' => 'Too many requests; please retry later.',
                    'type' => 'rate_limited',
                    'details' => ['retry_after_seconds' => $retry],
                ],
            ], 429, $this->headers($max, 0, time() + $retry));
        }

        /** @var Response $response */
        $response = $next($request);

        foreach ($this->headers($max, max(0, $max - $hits), time() + 60) as $header => $value) {
            $response->headers->set($header, $value);
        }

        return $response;
    }

    /** @return array{0: string, 1: int} */
    protected function resolveBucket(Request $request): array
    {
        if ($request->user()) {
            return ["aaop:rl:user:{$request->user()->id}", self::LIMIT_AUTH];
        }
        return ["aaop:rl:ip:{$request->ip()}", self::LIMIT_GUEST];
    }

    /** @return array<string, string> */
    protected function headers(int $limit, int $remaining, int $resetEpoch): array
    {
        return [
            'X-RateLimit-Limit'     => (string) $limit,
            'X-RateLimit-Remaining' => (string) $remaining,
            'X-RateLimit-Reset'     => (string) $resetEpoch,
        ];
    }
}
