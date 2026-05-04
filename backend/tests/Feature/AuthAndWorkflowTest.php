<?php

use App\Models\Membership;
use App\Models\User;
use App\Models\Workspace;
use App\Support\Rbac\Roles;

it('registers a user, auto-provisions a workspace, and authenticates', function () {
    $resp = $this->postJson('/api/v1/auth/register', [
        'email'                 => 'tester@aaop.test',
        'password'              => 'StrongPass!2345',
        'password_confirmation' => 'StrongPass!2345',
        'display_name'          => 'Tester',
        'workspace_name'        => 'Test WS',
    ]);
    $resp->assertCreated();
    $resp->assertJsonStructure(['user' => ['id', 'email'], 'workspace' => ['id', 'role']]);
    expect(User::query()->count())->toBe(1);
    expect(Workspace::query()->count())->toBe(1);
    expect(Membership::query()->where('role', Roles::OWNER)->count())->toBe(1);
});

it('creates and lists workflows scoped to a workspace', function () {
    $user = User::factory()->create();
    $ws = Workspace::query()->create(['name' => 'WS', 'slug' => 'ws-'.uniqid(), 'plan' => 'free', 'region' => 'us-ashburn-1']);
    Membership::query()->create(['user_id' => $user->id, 'workspace_id' => $ws->id, 'role' => Roles::OWNER]);

    $this->actingAs($user, 'web');

    $create = $this->withHeader('X-Workspace-Id', $ws->id)
        ->postJson('/api/v1/workflows', ['name' => 'My Flow']);
    $create->assertCreated();
    $create->assertJsonPath('name', 'My Flow');
    $create->assertJsonPath('status', 'draft');

    $list = $this->withHeader('X-Workspace-Id', $ws->id)
        ->getJson('/api/v1/workflows');
    $list->assertOk()->assertJsonCount(1, 'data');
});
