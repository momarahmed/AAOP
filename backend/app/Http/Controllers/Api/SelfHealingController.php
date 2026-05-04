<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SelfHealing\SelfHealingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** F10 — heal visibility API (records attempts for traces / learning loop). */
class SelfHealingController extends Controller
{
    public function strategies(SelfHealingService $svc): JsonResponse
    {
        return response()->json(['data' => $svc->defaultStrategyChain()]);
    }

    public function store(Request $request, SelfHealingService $svc): JsonResponse
    {
        /** @var \App\Models\Workspace $workspace */
        $workspace = $request->attributes->get('workspace');

        $data = $request->validate([
            'failure_signal' => ['required', 'string', 'max:64'],
            'strategy'       => ['required', 'string', 'max:32'],
            'status'         => ['nullable', 'string', 'in:attempted,succeeded,failed,skipped'],
            'run_id'         => ['nullable', 'uuid'],
            'node_run_id'    => ['nullable', 'uuid'],
            'meta'           => ['nullable', 'array'],
        ]);

        $row = $svc->record(
            $workspace,
            $data['failure_signal'],
            $data['strategy'],
            $data['status'] ?? 'attempted',
            $data['run_id'] ?? null,
            $data['node_run_id'] ?? null,
            $data['meta'] ?? null,
        );

        return response()->json([
            'id'       => $row->id,
            'strategy' => $row->strategy,
            'status'   => $row->status,
        ], 201);
    }
}
