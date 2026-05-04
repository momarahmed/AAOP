<?php

namespace App\Support;

use Illuminate\Support\Facades\Log;
use OpenTelemetry\Contrib\Otlp\SpanExporterFactory;
use OpenTelemetry\API\Trace\Propagation\TraceContextPropagator;
use OpenTelemetry\SDK\SdkBuilder;
use OpenTelemetry\SDK\Trace\SpanProcessor\BatchSpanProcessor;
use OpenTelemetry\SDK\Trace\TracerProvider;
use Throwable;

/** Boots OTEL globals once per PHP process (OTLP optional). */
final class OpenTelemetryRegistrar
{
    public static function register(bool $runningUnitTests): void
    {
        $builder = (new SdkBuilder)
            ->setPropagator(TraceContextPropagator::getInstance());

        $endpoint = env('OTEL_EXPORTER_OTLP_ENDPOINT');

        if (! $runningUnitTests && ! empty($endpoint)) {
            try {
                $exporter = (new SpanExporterFactory)->create();
                $processor = BatchSpanProcessor::builder($exporter)->build();
                $tracerProvider = TracerProvider::builder()
                    ->addSpanProcessor($processor)
                    ->build();
                $builder
                    ->setTracerProvider($tracerProvider)
                    ->setAutoShutdown(true);
            } catch (Throwable $e) {
                Log::warning('OpenTelemetry OTLP init failed; traces noop.', ['error' => $e->getMessage()]);
            }
        }

        $builder->buildAndRegisterGlobal();
    }
}
