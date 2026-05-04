<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Workspace;
use App\Services\Planner\WorkflowPlannerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

/** F07 — NL → workflow draft (Phase 2 scaffold). */
class PlannerController extends Controller
{
    public function generate(Request $request, WorkflowPlannerService $planner): JsonResponse
    {
        /** @var Workspace $workspace */
        $workspace = $request->attributes->get('workspace');
        Gate::authorize('workspace.view', $workspace);

        $data = $request->validate([
            'prompt' => ['required', 'string', 'max:8000'],
            'name'   => ['nullable', 'string', 'max:200'],
        ]);

        $out = $planner->generate($data['prompt'], $workspace, $data['name'] ?? null);

        return response()->json($out);
    }
}
