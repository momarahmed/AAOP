<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Run;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

/** F11 — lightweight run analytics (Phase 2 scaffold for dashboards). */
class ObservabilityController extends Controller
{
    public function summary(Request $request): JsonResponse
    {
        /** @var Workspace $workspace */
        $workspace = $request->attributes->get('workspace');
        Gate::authorize('workspace.view', $workspace);

        $since = now()->subHours(24);

        $base = Run::query()->where('workspace_id', $workspace->id)->where('created_at', '>=', $since);

        $counts = (clone $base)
            ->selectRaw('status, COUNT(*) as c')
            ->groupBy('status')
            ->pluck('c', 'status');

        $avgMs = (clone $base)->whereNotNull('duration_ms')->avg('duration_ms');

        $total = (clone $base)->count();
        $failed = (clone $base)->where('status', Run::STATUS_FAILED)->count();
        $failPct = $total > 0 ? round(100 * $failed / $total, 2) : 0.0;

        $queueDepth = (clone $base)->where('status', Run::STATUS_QUEUED)->count();

        return response()->json([
            'window'            => '24h',
            'runs_total'        => $total,
            'runs_by_status'    => $counts,
            'queue_depth'       => $queueDepth,
            'avg_duration_ms'   => $avgMs !== null ? (float) $avgMs : null,
            'failure_rate_pct'  => $failPct,
            'cost_credits_sum'  => (float) ((clone $base)->sum('cost_credits')),
            'generated_at'      => now()->toIso8601String(),
        ]);
    }

    /** OTel / trace export status (F12 observability hook). */
    public function tracing(Request $request): JsonResponse
    {
        /** @var Workspace $workspace */
        $workspace = $request->attributes->get('workspace');
        Gate::authorize('workspace.view', $workspace);

        $endpoint = env('OTEL_EXPORTER_OTLP_ENDPOINT');

        return response()->json([
            'otlp_configured' => ! empty($endpoint),
            'otlp_endpoint'   => $endpoint ? preg_replace('#//[^:]+@#', '//***@', (string) $endpoint) : null,
            'service_name'    => env('OTEL_SERVICE_NAME', config('app.name')),
            'trace_header'    => 'traceparent',
            'generated_at'    => now()->toIso8601String(),
        ]);
    }
}
