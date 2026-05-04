<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use OpenTelemetry\API\Globals;
use OpenTelemetry\API\Trace\SpanKind;
use OpenTelemetry\API\Trace\StatusCode;
use Symfony\Component\HttpFoundation\Response;

/** Creates an HTTP server span + propagates W3C traceparent on the response. */
class OpenTelemetryMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $tracer = Globals::tracerProvider()->getTracer(
            'com.aaop.backend',
            null,
            'https://opentelemetry.io/schemas/1.35.0',
        );

        $carrier = [];
        foreach ($request->headers->all() as $key => $values) {
            $carrier[$key] = $values[0] ?? '';
        }

        $parentContext = Globals::propagator()->extract($carrier);
        $path = '/'.$request->path();

        $span = $tracer->spanBuilder($request->method().' '.$path)
            ->setSpanKind(SpanKind::KIND_SERVER)
            ->setParent($parentContext)
            ->startSpan();

        $scope = $span->activate();

        try {
            /** @var Response $response */
            $response = $next($request);

            $status = $response->getStatusCode();
            $span->setAttribute('http.response.status_code', $status);
            if ($status >= 500) {
                $span->setStatus(StatusCode::STATUS_ERROR);
            }

            $ctx = $span->getContext();
            if ($ctx->isValid()) {
                $flags = str_pad(dechex($ctx->getTraceFlags()), 2, '0', STR_PAD_LEFT);
                $response->headers->set('traceparent', sprintf(
                    '00-%s-%s-%s',
                    $ctx->getTraceId(),
                    $ctx->getSpanId(),
                    $flags,
                ));
            }

            return $response;
        } catch (\Throwable $e) {
            $span->setStatus(StatusCode::STATUS_ERROR, $e->getMessage());
            throw $e;
        } finally {
            $scope->detach();
            $span->end();
        }
    }
}
