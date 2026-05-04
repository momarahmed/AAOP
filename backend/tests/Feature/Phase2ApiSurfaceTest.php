<?php

use App\Models\Membership;
use App\Models\User;
use App\Models\Workspace;
use App\Support\Rbac\Roles;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    $this->user = User::factory()->create([
        'hashed_password' => Hash::make('Password!123'),
    ]);
    $this->ws = Workspace::query()->create([
        'name'   => 'API WS',
        'slug'   => 'apiws-'.uniqid(),
        'plan'   => 'free',
        'region' => 'us-ashburn-1',
    ]);
    Membership::query()->create([
        'user_id' => $this->user->id, 'workspace_id' => $this->ws->id, 'role' => Roles::OWNER,
    ]);
    $this->actingAs($this->user, 'web');
});

it('returns planner draft from NL prompt', function () {
    $r = $this->withHeader('X-Workspace-Id', $this->ws->id)
        ->postJson('/api/v1/planner/generate', ['prompt' => 'Reconcile invoices daily']);
    $r->assertOk();
    $r->assertJsonStructure(['graph', 'rationale', 'estimated_cost_credits']);
});

it('returns CUA status and creates a stub session', function () {
    $this->withHeader('X-Workspace-Id', $this->ws->id)->getJson('/api/v1/cua/status')->assertOk()
        ->assertJsonStructure(['status', 'image']);
    $this->withHeader('X-Workspace-Id', $this->ws->id)->postJson('/api/v1/cua/sessions', [])->assertCreated()
        ->assertJsonStructure(['session_id']);
});

it('lists MCP stub tools and invokes echo', function () {
    $this->withHeader('X-Workspace-Id', $this->ws->id)->getJson('/api/v1/mcp/tools')->assertOk()
        ->assertJsonPath('data.0.name', 'aaop.echo');
    $r = $this->withHeader('X-Workspace-Id', $this->ws->id)->postJson('/api/v1/mcp/invoke', [
        'name'      => 'aaop.echo',
        'arguments' => ['hello' => 'world'],
    ]);
    $r->assertOk();
    expect($r->json('result.echo'))->toMatchArray(['hello' => 'world']);
});

it('returns observability summary', function () {
    $this->withHeader('X-Workspace-Id', $this->ws->id)->getJson('/api/v1/observability/summary')->assertOk()
        ->assertJsonStructure(['runs_total', 'runs_by_status', 'queue_depth', 'failure_rate_pct', 'generated_at']);
});
