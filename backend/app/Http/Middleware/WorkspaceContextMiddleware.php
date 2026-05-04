<?php

namespace App\Http\Middleware;

use App\Models\Workspace;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Resolves the active workspace from `X-Workspace-Id` header or
 * `?workspace_id=` query parameter, validates membership, and injects
 * the resolved workspace into the request as `workspace`.
 *
 * Implements the row-level tenant scoping contract used by every
 * resource controller (T-F02-09 / T-F04-01).
 */
class WorkspaceContextMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (! $user) {
            return response()->json([
                'error' => [
                    'code' => 'unauthenticated',
                    'message' => 'Authentication required.',
                    'type' => 'auth_error',
                ],
            ], 401);
        }

        $id = $request->header('X-Workspace-Id') ?: $request->query('workspace_id');
        if (! $id) {
            // Fall back to the user's first membership (acceptable default for SPA).
            $id = $user->memberships()->orderBy('created_at')->value('workspace_id');
        }

        if (! $id) {
            return response()->json([
                'error' => [
                    'code' => 'workspace_missing',
                    'message' => 'Active workspace not specified.',
                    'type' => 'validation_error',
                ],
            ], 400);
        }

        /** @var Workspace|null $ws */
        $ws = Workspace::query()->whereKey($id)->first();
        if (! $ws || $ws->roleFor($user) === null) {
            return response()->json([
                'error' => [
                    'code' => 'workspace_forbidden',
                    'message' => 'You do not have access to this workspace.',
                    'type' => 'permission_error',
                ],
            ], 403);
        }

        $request->attributes->set('workspace', $ws);
        return $next($request);
    }
}
