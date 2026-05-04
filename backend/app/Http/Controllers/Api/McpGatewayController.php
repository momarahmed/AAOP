<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Workspace;
use App\Services\Mcp\McpGatewayService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

/** MCP gateway (F13-04 scaffold) — tool list + invoke. */
class McpGatewayController extends Controller
{
    public function tools(Request $request, McpGatewayService $mcp): JsonResponse
    {
        /** @var Workspace $workspace */
        $workspace = $request->attributes->get('workspace');
        Gate::authorize('workspace.view', $workspace);

        $remote = $request->query('remote');
        $remote = is_string($remote) ? $remote : null;

        return response()->json(['data' => $mcp->listTools($remote)]);
    }

    public function invoke(Request $request, McpGatewayService $mcp): JsonResponse
    {
        /** @var Workspace $workspace */
        $workspace = $request->attributes->get('workspace');
        Gate::authorize('workspace.view', $workspace);

        $data = $request->validate([
            'name'      => ['required', 'string', 'max:255'],
            'arguments' => ['nullable', 'array'],
            'remote'    => ['nullable', 'string', 'max:2048'],
        ]);

        $result = $mcp->callTool(
            $data['name'],
            $data['arguments'] ?? [],
            $data['remote'] ?? null,
        );

        return response()->json(['result' => $result]);
    }
}
