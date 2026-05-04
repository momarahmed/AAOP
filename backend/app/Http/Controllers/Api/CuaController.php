<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Workspace;
use App\Services\Cua\CuaSandboxManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

/** F08 — CUA sandbox façade (stub until trycua/cua is wired). */
class CuaController extends Controller
{
    public function status(Request $request, CuaSandboxManager $cua): JsonResponse
    {
        /** @var Workspace $workspace */
        $workspace = $request->attributes->get('workspace');
        Gate::authorize('workspace.view', $workspace);

        return response()->json($cua->status());
    }

    public function storeSession(Request $request, CuaSandboxManager $cua): JsonResponse
    {
        /** @var Workspace $workspace */
        $workspace = $request->attributes->get('workspace');
        Gate::authorize('workspace.view', $workspace);

        return response()->json($cua->createSession($workspace->id), 201);
    }

    public function destroySession(Request $request, CuaSandboxManager $cua, string $session): JsonResponse
    {
        /** @var Workspace $workspace */
        $workspace = $request->attributes->get('workspace');
        Gate::authorize('workspace.view', $workspace);

        $cua->destroySession($session);

        return response()->json(['ok' => true]);
    }
}
