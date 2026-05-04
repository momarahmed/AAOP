<?php

use App\Http\Controllers\Api\ApprovalController;
use App\Http\Controllers\Api\AuditController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\PolicyController;
use App\Http\Controllers\Api\RunController;
use App\Http\Controllers\Api\SecretController;
use App\Http\Controllers\Api\WorkflowController;
use App\Http\Controllers\Api\WorkspaceController;
use Illuminate\Support\Facades\Route;

/*
|---------------------------------------------------------------------
| AAOP API — versioned at /api/v1 (PRD §20.1)
|---------------------------------------------------------------------
| Sanctum's stateful guard is wired in bootstrap/app.php; the SPA must
| first hit `GET /sanctum/csrf-cookie` before issuing POST/PATCH/DELETE.
*/

// Public health check (Docker healthcheck targets this)
Route::get('/health', [HealthController::class, 'show']);

Route::prefix('v1')->group(function () {

    /* ---------------------------------------------------------------
     | Auth (cookie-based SPA)
     |---------------------------------------------------------------*/
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login',    [AuthController::class, 'login']);

    Route::middleware(['auth:sanctum'])->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get ('/auth/me',     [AuthController::class, 'me']);

        /* -----------------------------------------------------------
         | Workspaces
         |-----------------------------------------------------------*/
        Route::get ('/workspaces',                          [WorkspaceController::class, 'index']);
        Route::post('/workspaces',                          [WorkspaceController::class, 'store'])
            ->middleware('idempotent');
        Route::get ('/workspaces/{workspace}/members',      [WorkspaceController::class, 'members']);
        Route::post('/workspaces/{workspace}/members',      [WorkspaceController::class, 'invite']);

        /* -----------------------------------------------------------
         | Resources scoped to active workspace (X-Workspace-Id header)
         |-----------------------------------------------------------*/
        Route::middleware(['workspace.context'])->group(function () {

            // Workflows ------------------------------------------------
            Route::get   ('/workflows',                         [WorkflowController::class, 'index']);
            Route::post  ('/workflows',                         [WorkflowController::class, 'store'])
                ->middleware('idempotent');
            Route::get   ('/workflows/{workflow}',              [WorkflowController::class, 'show']);
            Route::patch ('/workflows/{workflow}',              [WorkflowController::class, 'update']);
            Route::delete('/workflows/{workflow}',              [WorkflowController::class, 'destroy']);
            Route::post  ('/workflows/{workflow}/versions',     [WorkflowController::class, 'saveVersion'])
                ->middleware('idempotent');
            Route::get   ('/workflows/{workflow}/versions',     [WorkflowController::class, 'listVersions']);
            Route::post  ('/workflows/{workflow}/promote',      [WorkflowController::class, 'promote']);

            // Runs ----------------------------------------------------
            Route::get  ('/workflows/{workflow}/runs',          [RunController::class, 'index']);
            Route::post ('/workflows/{workflow}/runs',          [RunController::class, 'start'])
                ->middleware('idempotent');
            Route::get  ('/runs/{run}',                         [RunController::class, 'show']);
            Route::post ('/runs/{run}/cancel',                  [RunController::class, 'cancel']);

            // Secrets -------------------------------------------------
            Route::get   ('/secrets',           [SecretController::class, 'index']);
            Route::post  ('/secrets',           [SecretController::class, 'store']);
            Route::delete('/secrets/{secret}',  [SecretController::class, 'destroy']);

            // Policies ------------------------------------------------
            Route::get  ('/policies',                 [PolicyController::class, 'index']);
            Route::post ('/policies',                 [PolicyController::class, 'store']);
            Route::post ('/policies/{policy}/evaluate', [PolicyController::class, 'evaluate']);

            // Approvals -----------------------------------------------
            Route::get ('/approvals',                  [ApprovalController::class, 'index']);
            Route::post('/approvals/{approval}/decide', [ApprovalController::class, 'decide']);

            // Audit log -----------------------------------------------
            Route::get('/audit-logs',         [AuditController::class, 'index']);
            Route::get('/audit-logs/export',  [AuditController::class, 'export']);
        });
    });
});
