<?php

use App\Models\Membership;
use App\Models\Policy;
use App\Models\User;
use App\Models\Workflow;
use App\Models\WorkflowVersion;
use App\Models\Workspace;
use App\Support\Rbac\Roles;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Symfony\Component\Process\ExecutableFinder;

uses(RefreshDatabase::class);

beforeEach(function () {
    config(['services.opa.permissive_without_binary' => false]);
});

function bootstrapWorkspaceOwner(): array
{
    $user = User::factory()->create();
    $ws = Workspace::query()->create([
        'name'   => 'Phase3 WS',
        'slug'   => 'ph3-'.uniqid(),
        'plan'   => 'free',
        'region' => 'us-ashburn-1',
    ]);
    Membership::query()->create([
        'user_id' => $user->id, 'workspace_id' => $ws->id, 'role' => Roles::OWNER,
    ]);
    $user->update(['default_workspace_id' => $ws->id]);

    return [$user, $ws];
}

it('returns routing fallback chain for execution orchestrator', function () {
    [$user, $ws] = bootstrapWorkspaceOwner();
    $this->actingAs($user, 'web');

    $this->withHeader('X-Workspace-Id', $ws->id)
        ->postJson('/api/v1/execution/route-decision', [
            'preferred_engine' => 'dom',
            'failure_signal'   => 'selector_not_found',
        ])
        ->assertOk()
        ->assertJsonPath('primary', 'dom')
        ->assertJsonStructure(['fallback_chain']);
});

it('lists self-healing strategies and records an attempt', function () {
    [$user, $ws] = bootstrapWorkspaceOwner();
    $this->actingAs($user, 'web');

    $this->withHeader('X-Workspace-Id', $ws->id)
        ->getJson('/api/v1/self-healing/strategies')
        ->assertOk()
        ->assertJsonPath('data.0.strategy', 'retry');

    $this->withHeader('X-Workspace-Id', $ws->id)
        ->postJson('/api/v1/self-healing/attempts', [
            'failure_signal' => 'selector_not_found',
            'strategy'       => 'healenium',
            'status'         => 'attempted',
        ])
        ->assertCreated()
        ->assertJsonPath('strategy', 'healenium');
});

it('exposes observability tracing status', function () {
    [$user, $ws] = bootstrapWorkspaceOwner();
    $this->actingAs($user, 'web');

    $this->withHeader('X-Workspace-Id', $ws->id)
        ->getJson('/api/v1/observability/tracing')
        ->assertOk()
        ->assertJsonStructure(['otlp_configured', 'trace_header', 'service_name']);
});

it('evaluates policy with OPA when binary is available', function () {
    $opa = (new ExecutableFinder)->find('opa');
    if ($opa === null || ! is_executable($opa)) {
        $this->markTestSkipped('OPA binary not installed (rebuild backend Docker image).');
    }

    [$user, $ws] = bootstrapWorkspaceOwner();
    $this->actingAs($user, 'web');

    $policy = Policy::query()->create([
        'workspace_id' => $ws->id,
        'name'         => 'test-deny',
        'scope'        => 'workspace',
        'enforced_at'  => ['run'],
        'version'      => 1,
        'enabled'      => true,
        'rego'         => <<<'REGO'
package aaop

violations[msg] {
    input.payload.deny == true
    msg := "deny"
}

allow {
    count(violations) == 0
}
REGO,
        'created_by' => $user->id,
    ]);

    $this->withHeader('X-Workspace-Id', $ws->id)
        ->postJson('/api/v1/policies/'.$policy->id.'/evaluate', ['payload' => ['deny' => true]])
        ->assertOk()
        ->assertJsonPath('allow', false)
        ->assertJsonPath('evaluator', 'opa');

    $this->withHeader('X-Workspace-Id', $ws->id)
        ->postJson('/api/v1/policies/'.$policy->id.'/evaluate', ['payload' => ['deny' => false]])
        ->assertOk()
        ->assertJsonPath('allow', true);
});

it('assigns canary lane when workflow canary is configured', function () {
    [$user, $ws] = bootstrapWorkspaceOwner();
    $this->actingAs($user, 'web');

    $wf = Workflow::query()->create([
        'workspace_id'       => $ws->id,
        'name'               => 'Canary WF',
        'status'             => 'published',
        'environment'        => 'staging',
        'created_by'         => $user->id,
        'canary_percent'     => 100,
        'canary_version_id'  => null,
        'current_version_id' => null,
    ]);

    $vStable = WorkflowVersion::query()->create([
        'workflow_id' => $wf->id,
        'version'     => 1,
        'graph'       => ['nodes' => [], 'edges' => []],
        'hash'        => hash('sha256', json_encode(['nodes' => [], 'edges' => []], JSON_THROW_ON_ERROR)),
        'created_by'  => $user->id,
    ]);
    $vCanary = WorkflowVersion::query()->create([
        'workflow_id' => $wf->id,
        'version'     => 2,
        'graph'       => ['nodes' => [['id' => 'n1', 'type' => 'noop']], 'edges' => []],
        'hash'        => hash('sha256', json_encode(['nodes' => [['id' => 'n1', 'type' => 'noop']], 'edges' => []], JSON_THROW_ON_ERROR)),
        'created_by'  => $user->id,
    ]);

    $wf->update([
        'current_version_id' => $vStable->id,
        'canary_version_id'  => $vCanary->id,
    ]);

    $this->withHeader('X-Workspace-Id', $ws->id)
        ->withHeader('X-Correlation-ID', 'fixed-canary-test')
        ->postJson('/api/v1/workflows/'.$wf->id.'/runs', [])
        ->assertAccepted();

    $run = $wf->runs()->latest()->first();
    expect($run)->not->toBeNull();
    expect($run->deployment_lane)->toBe('canary');
    expect($run->version_id)->toBe($vCanary->id);
});
