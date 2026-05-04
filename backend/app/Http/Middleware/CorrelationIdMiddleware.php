<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Uid\Ulid;

/**
 * Attaches a correlation ID to every request and propagates it via
 * `X-Correlation-ID` on the response, per PRD §20.1.
 *
 * If the client provides one we honour it (so external trace IDs join
 * up cleanly); otherwise we mint a sortable ULID.
 */
class CorrelationIdMiddleware
{
    public const HEADER = 'X-Correlation-ID';
    public const ATTRIBUTE = 'correlation_id';

    public function handle(Request $request, Closure $next): Response
    {
        $incoming = trim((string) $request->headers->get(self::HEADER, ''));
        $id = $incoming !== '' && strlen($incoming) <= 64
            ? $incoming
            : (string) new Ulid();

        $request->attributes->set(self::ATTRIBUTE, $id);
        Log::shareContext(['correlation_id' => $id]);

        /** @var Response $response */
        $response = $next($request);
        $response->headers->set(self::HEADER, $id);

        return $response;
    }
}
