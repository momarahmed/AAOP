<?php

use App\Http\Middleware\AuditLogMiddleware;
use App\Http\Middleware\CorrelationIdMiddleware;
use App\Http\Middleware\IdempotencyKeyMiddleware;
use App\Http\Middleware\RateLimitHeadersMiddleware;
use App\Http\Middleware\WorkspaceContextMiddleware;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;

/*
|--------------------------------------------------------------------------
| AAOP — Laravel 12 application bootstrap
|--------------------------------------------------------------------------
| Slim, modern style introduced by Laravel 11/12. All middleware, route
| files, and exception rendering wired in here. The middleware stack
| implements PRD §20 (correlation IDs, idempotency, rate-limit headers,
| structured error model).
*/

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        // Laravel's built-in liveness check stays at /up so it does not
        // shadow our richer JSON probe at /api/health (HealthController).
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {

        // Apply Sanctum's stateful guard to API requests so the Next.js SPA
        // can authenticate via session cookies.
        $middleware->statefulApi();

        // Always-on middleware chain (request-scoped concerns).
        $middleware->append(CorrelationIdMiddleware::class);
        $middleware->append(RateLimitHeadersMiddleware::class);

        // Per-route alias map — used in routes/api.php
        $middleware->alias([
            'idempotent'         => IdempotencyKeyMiddleware::class,
            'workspace.context'  => WorkspaceContextMiddleware::class,
            'audit'              => AuditLogMiddleware::class,
            'sanctum.stateful'   => EnsureFrontendRequestsAreStateful::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Render every API exception with the AAOP standard error model
        // (PRD §20.2) — `code`, `message`, `type`, `details`, `correlation_id`.
        $exceptions->render(function (\Throwable $e, \Illuminate\Http\Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return App\Support\ApiErrorRenderer::render($e, $request);
            }
        });
    })
    ->create();
