<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Orchestration\ExecutionOrchestratorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** F09 — routing / fallback matrix (scaffold for worker runtimes). */
class ExecutionOrchestratorController extends Controller
{
    public function routeDecision(Request $request, ExecutionOrchestratorService $orch): JsonResponse
    {
        /** @var \App\Models\Workspace $workspace */
        $workspace = $request->attributes->get('workspace');

        $data = $request->validate([
            'preferred_engine' => ['nullable', 'string', 'in:auto,dom,vision,mcp'],
            'failure_signal'   => ['required', 'string', 'max:64'],
        ]);

        $preferred = $data['preferred_engine'] ?? 'auto';
        $decision = $orch->routeDecision($preferred, $data['failure_signal']);

        return response()->json([
            'workspace_id' => $workspace->id,
            'primary'      => $decision['primary'],
            'fallback_chain' => $decision['chain'],
        ]);
    }
}
