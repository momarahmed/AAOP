<?php

use App\Http\Controllers\Api\ApprovalController;
use App\Http\Controllers\Api\AuditController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ComplianceController;
use App\Http\Controllers\Api\CuaController;
use App\Http\Controllers\Api\ExecutionOrchestratorController;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\McpGatewayController;
use App\Http\Controllers\Api\MemoryController;
use App\Http\Controllers\Api\ObservabilityController;
use App\Http\Controllers\Api\PlannerController;
use App\Http\Controllers\Api\PolicyController;
use App\Http\Controllers\Api\RunController;
use App\Http\Controllers\Api\SelfHealingController;
use App\Http\Controllers\Api\SecretController;
use App\Http\Controllers\Api\SsoController;
use App\Http\Controllers\Api\UiMappingController;
use App\Http\Controllers\Api\WebauthnController;
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

    /* Federated SSO (Phase 4-5; PRD T-F02-02 / T-F02-03) */
    Route::get ('/auth/sso/providers',                    [SsoController::class, 'providers']);
    Route::post('/auth/sso/{provider}/redirect',          [SsoController::class, 'redirect']);
    Route::post('/auth/sso/{provider}/callback',          [SsoController::class, 'callback']);

    /* WebAuthn / FIDO2 — login flows do not require an existing session */
    Route::post('/auth/webauthn/login/options',           [WebauthnController::class, 'loginOptions']);
    Route::post('/auth/webauthn/login/verify',            [WebauthnController::class, 'loginVerify']);

    Route::middleware(['auth:sanctum'])->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get ('/auth/me',     [AuthController::class, 'me']);

        /* WebAuthn — credential management for the signed-in user */
        Route::post  ('/auth/webauthn/register/options',  [WebauthnController::class, 'registerOptions']);
        Route::post  ('/auth/webauthn/register/verify',   [WebauthnController::class, 'registerVerify']);
        Route::get   ('/auth/webauthn/credentials',       [WebauthnController::class, 'credentials']);
        Route::delete('/auth/webauthn/credentials/{id}',  [WebauthnController::class, 'deleteCredential']);

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
            Route::get  ('/runs/{run}/stream',                   [RunController::class, 'stream']);
            Route::get  ('/runs/{run}',                         [RunController::class, 'show']);
            Route::post ('/runs/{run}/cancel',                  [RunController::class, 'cancel']);

            // Phase 2 — F06/F07/F08/F11 (+ MCP gateway scaffold, PRD F13-04)
            Route::post ('/planner/generate',                  [PlannerController::class, 'generate']);
            Route::get  ('/cua/status',                         [CuaController::class, 'status']);
            Route::post ('/cua/sessions',                      [CuaController::class, 'storeSession']);
            Route::delete('/cua/sessions/{session}',            [CuaController::class, 'destroySession']);
            Route::get  ('/mcp/tools',                         [McpGatewayController::class, 'tools']);
            Route::post ('/mcp/invoke',                        [McpGatewayController::class, 'invoke']);
            Route::get  ('/observability/summary',             [ObservabilityController::class, 'summary']);
            Route::get  ('/observability/tracing',             [ObservabilityController::class, 'tracing']);

            // Phase 3 — F09 Execution Orchestrator, F10 Self-Healing
            Route::post ('/execution/route-decision',          [ExecutionOrchestratorController::class, 'routeDecision']);
            Route::get  ('/self-healing/strategies',           [SelfHealingController::class, 'strategies']);
            Route::post ('/self-healing/attempts',             [SelfHealingController::class, 'store']);

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

            // Phase 4-5 — Memory store
            Route::get   ('/memory',          [MemoryController::class, 'index']);
            Route::post  ('/memory',          [MemoryController::class, 'store'])
                ->middleware('idempotent');
            Route::delete('/memory/{memory}', [MemoryController::class, 'destroy']);

            // Phase 4-5 — UI Mapping store (heal feedback loop)
            Route::get ('/ui-mappings', [UiMappingController::class, 'index']);
            Route::post('/ui-mappings', [UiMappingController::class, 'store'])
                ->middleware('idempotent');

            // Phase 4-5 — Compliance (FedRAMP / HIPAA / SOC2)
            Route::get ('/compliance/controls',       [ComplianceController::class, 'controls']);
            Route::get ('/compliance/attestations',   [ComplianceController::class, 'attestations']);
            Route::post('/compliance/attestations',   [ComplianceController::class, 'attest']);
            Route::get ('/compliance/retention',      [ComplianceController::class, 'retention']);
            Route::post('/compliance/retention',      [ComplianceController::class, 'setRetention']);
            Route::get ('/compliance/summary',        [ComplianceController::class, 'summary']);
        });
    });
});
