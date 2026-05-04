<?php

namespace App\Support;

use App\Http\Middleware\CorrelationIdMiddleware;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;
use Throwable;

/**
 * Implements the canonical AAOP error envelope (PRD §20.2).
 *
 *   {
 *     "error": {
 *       "code": "...",
 *       "message": "...",
 *       "type": "...",
 *       "details": {...},
 *       "correlation_id": "..."
 *     }
 *   }
 *
 * Every API exception flows through here, ensuring a single, predictable
 * shape that the frontend can consume.
 */
final class ApiErrorRenderer
{
    public static function render(Throwable $e, Request $request): JsonResponse
    {
        $correlationId = (string) $request->attributes->get(
            CorrelationIdMiddleware::ATTRIBUTE,
            $request->headers->get('X-Correlation-ID', '')
        );

        if ($e instanceof ValidationException) {
            return self::envelope(
                status: 422,
                code: 'validation_error',
                message: 'The request failed validation.',
                type: 'validation_error',
                details: ['errors' => $e->errors()],
                correlationId: $correlationId,
            );
        }

        if ($e instanceof AuthenticationException) {
            return self::envelope(
                status: 401,
                code: 'unauthenticated',
                message: 'Authentication required.',
                type: 'auth_error',
                details: null,
                correlationId: $correlationId,
            );
        }

        if ($e instanceof AuthorizationException) {
            return self::envelope(
                status: 403,
                code: 'forbidden',
                message: $e->getMessage() ?: 'You do not have permission to perform this action.',
                type: 'permission_error',
                details: null,
                correlationId: $correlationId,
            );
        }

        if ($e instanceof ModelNotFoundException || $e instanceof NotFoundHttpException) {
            return self::envelope(
                status: 404,
                code: 'not_found',
                message: 'Resource not found.',
                type: 'not_found',
                details: null,
                correlationId: $correlationId,
            );
        }

        if ($e instanceof TooManyRequestsHttpException) {
            return self::envelope(
                status: 429,
                code: 'rate_limited',
                message: 'Too many requests.',
                type: 'rate_limited',
                details: null,
                correlationId: $correlationId,
            );
        }

        if ($e instanceof HttpExceptionInterface) {
            $status = $e->getStatusCode();
            return self::envelope(
                status: $status,
                code: 'http_'.$status,
                message: $e->getMessage() ?: 'HTTP error.',
                type: $status >= 500 ? 'internal_error' : 'http_error',
                details: null,
                correlationId: $correlationId,
            );
        }

        // Unknown / 500
        $debug = config('app.debug');
        return self::envelope(
            status: 500,
            code: 'internal_error',
            message: $debug ? $e->getMessage() : 'Internal server error.',
            type: 'internal_error',
            details: $debug ? [
                'exception' => get_class($e),
                'file'      => $e->getFile().':'.$e->getLine(),
            ] : null,
            correlationId: $correlationId,
        );
    }

    private static function envelope(
        int $status,
        string $code,
        string $message,
        string $type,
        ?array $details,
        string $correlationId,
    ): JsonResponse {
        return response()->json([
            'error' => array_filter([
                'code'           => $code,
                'message'        => $message,
                'type'           => $type,
                'details'        => $details,
                'correlation_id' => $correlationId !== '' ? $correlationId : null,
            ], static fn ($v) => $v !== null),
        ], $status);
    }
}
