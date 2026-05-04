<?php

use App\Models\Membership;
use App\Models\User;
use App\Models\Workspace;
use App\Support\Rbac\Roles;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function bootstrapPh45WorkspaceOwner(): array
{
    $user = User::factory()->create();
    $ws = Workspace::query()->create([
        'name'   => 'Phase45 WS',
        'slug'   => 'ph45-'.uniqid(),
        'plan'   => 'free',
        'region' => 'us-ashburn-1',
    ]);
    Membership::query()->create([
        'user_id' => $user->id, 'workspace_id' => $ws->id, 'role' => Roles::OWNER,
    ]);
    $user->update(['default_workspace_id' => $ws->id]);
    return [$user, $ws];
}

it('upserts and lists memory items for a workspace', function () {
    [$user, $ws] = bootstrapPh45WorkspaceOwner();
    $this->actingAs($user, 'web');

    $payload = [
        'kind'      => 'semantic',
        'namespace' => 'planner',
        'key'       => 'preferred_route_chain',
        'content'   => ['order' => ['dom', 'vision', 'mcp']],
        'tags'      => ['planner', 'preferences'],
    ];

    $this->withHeader('X-Workspace-Id', $ws->id)
        ->postJson('/api/v1/memory', $payload)
        ->assertCreated()
        ->assertJsonPath('kind', 'semantic')
        ->assertJsonPath('namespace', 'planner');

    // Second call must update, not duplicate
    $this->withHeader('X-Workspace-Id', $ws->id)
        ->postJson('/api/v1/memory', array_merge($payload, [
            'content' => ['order' => ['vision', 'dom']],
        ]))
        ->assertOk();

    $this->withHeader('X-Workspace-Id', $ws->id)
        ->getJson('/api/v1/memory?kind=semantic')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.content.order.0', 'vision');
});

it('upserts UI mappings and increments observed_count', function () {
    [$user, $ws] = bootstrapPh45WorkspaceOwner();
    $this->actingAs($user, 'web');

    $payload = [
        'app_url'       => 'https://app.example.com/dashboard',
        'element_label' => 'Submit invoice',
        'selector'      => 'button[data-test=submit]',
        'source'        => 'observed',
        'confidence'    => 0.92,
    ];

    $this->withHeader('X-Workspace-Id', $ws->id)
        ->postJson('/api/v1/ui-mappings', $payload)
        ->assertCreated()
        ->assertJsonPath('observed_count', 1);

    // Same lookup key → update, count goes to 2 with heal source flagging last_heal_at
    $this->withHeader('X-Workspace-Id', $ws->id)
        ->postJson('/api/v1/ui-mappings', array_merge($payload, [
            'source'   => 'heal',
            'selector' => 'button[data-test=submit-invoice]',
        ]))
        ->assertOk()
        ->assertJsonPath('observed_count', 2)
        ->assertJsonPath('source', 'heal');

    $this->withHeader('X-Workspace-Id', $ws->id)
        ->getJson('/api/v1/ui-mappings?app_url=https://app.example.com/dashboard')
        ->assertOk()
        ->assertJsonCount(1, 'data');
});
