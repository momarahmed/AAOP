<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;

class HealthController extends Controller
{
    public function show(): JsonResponse
    {
        $checks = [
            'app' => true,
            'database' => $this->safe(fn () => DB::connection()->getPdo() !== null),
            // Predis returns a `Predis\Response\Status` whose payload is
            // "PONG"; phpredis returns the literal string `+PONG`/true.
            // Normalise both via __toString().
            'redis'    => $this->safe(fn () => str_contains(strtoupper((string) Redis::connection()->ping()), 'PONG')),
        ];

        $ok = ! in_array(false, $checks, true);
        return response()->json([
            'ok'      => $ok,
            'service' => 'aaop-backend',
            'version' => 'v0.1.0-dev',
            'checks'  => $checks,
            'time'    => now()->toIso8601String(),
        ], $ok ? 200 : 503);
    }

    private function safe(\Closure $fn): bool
    {
        try {
            return (bool) $fn();
        } catch (\Throwable) {
            return false;
        }
    }
}
