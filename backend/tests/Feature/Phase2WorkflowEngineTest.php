<?php

use App\Models\Membership;
use App\Models\Run;
use App\Models\User;
use App\Models\Workspace;
use App\Models\Workflow;
use App\Services\WorkflowService;
use App\Support\Rbac\Roles;
use Illuminate\Support\Facades\Hash;

it('executes a queued run to succeeded with checkpoints and node runs', function () {
    $user = User::factory()->create([
        'hashed_password' => Hash::make('Password!123'),
    ]);
    $ws = Workspace::query()->create([
        'name'   => 'Test WS',
        'slug'   => 'tws-'.uniqid(),
        'plan'   => 'free',
        'region' => 'us-ashburn-1',
    ]);
    Membership::query()->create([
        'user_id' => $user->id, 'workspace_id' => $ws->id, 'role' => Roles::OWNER,
    ]);

    /** @var WorkflowService $svc */
    $svc = app(WorkflowService::class);
    $wf = $svc->create($ws, $user, 'Engine Test', null, null);
    $svc->saveVersion($wf, $user, [
        'schema_version' => '1.0',
        'name'           => 'Engine Test',
        'nodes'          => [
            ['id' => 'a', 'type' => 'web.open_url', 'config' => []],
            ['id' => 'b', 'type' => 'langgraph.agent', 'config' => []],
        ],
        'edges' => [['from' => 'a', 'to' => 'b']],
    ], ['thread_id' => 'thread-test']);

    $this->actingAs($user, 'web');

    $resp = $this->withHeader('X-Workspace-Id', $ws->id)
        ->postJson('/api/v1/workflows/'.$wf->id.'/runs', ['trigger' => 'manual']);
    $resp->assertAccepted();

    $runId = $resp->json('run_id');
    expect($runId)->not->toBeNull();

    $run = Run::query()->findOrFail($runId);
    expect($run->status)->toBe(Run::STATUS_SUCCEEDED);
    expect($run->nodeRuns()->count())->toBe(2);
    expect($run->langgraph_checkpoint)->not->toBeNull();
    expect(\App\Models\LangGraphCheckpoint::query()->where('run_id', $runId)->count())->toBeGreaterThan(0);
});
