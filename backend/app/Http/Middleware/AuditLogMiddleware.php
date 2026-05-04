<?php

namespace App\Http\Middleware;

use App\Services\AuditLogger;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Lightweight audit emitter for sensitive HTTP routes.
 *
 * The middleware records a high-level audit event (action, target,
 * actor, response status). Detailed business audits are emitted from
 * domain services (e.g. WorkflowService) so that we capture intent
 * not just transport.
 */
class AuditLogMiddleware
{
    public function __construct(private readonly AuditLogger $audit)
    {
    }

    public function handle(Request $request, Closure $next, string $action = 'http.request'): Response
    {
        /** @var Response $response */
        $response = $next($request);

        $user = $request->user();
        $this->audit->record(
            workspaceId: optional($request->attributes->get('workspace'))->id,
            actorId:    $user?->id,
            actorType:  $user ? 'user' : 'anonymous',
            action:     $action,
            targetType: 'http',
            targetId:   null,
            meta: [
                'method'         => $request->method(),
                'path'           => $request->path(),
                'status'         => $response->getStatusCode(),
                'correlation_id' => $request->attributes->get(CorrelationIdMiddleware::ATTRIBUTE),
                'ip'             => $request->ip(),
            ],
        );

        return $response;
    }
}
