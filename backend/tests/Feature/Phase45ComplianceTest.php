<?php

use App\Models\ComplianceControl;
use App\Models\Membership;
use App\Models\User;
use App\Models\Workspace;
use App\Services\Compliance\ComplianceCatalog;
use App\Support\Rbac\Roles;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function bootstrapComplianceOwner(): array
{
    $user = User::factory()->create();
    $ws = Workspace::query()->create([
        'name'   => 'Compliance WS',
        'slug'   => 'cmp-'.uniqid(),
        'plan'   => 'free',
        'region' => 'us-ashburn-1',
    ]);
    Membership::query()->create([
        'user_id' => $user->id, 'workspace_id' => $ws->id, 'role' => Roles::OWNER,
    ]);
    $user->update(['default_workspace_id' => $ws->id]);
    return [$user, $ws];
}

beforeEach(function () {
    app(ComplianceCatalog::class)->ensureSeeded();
});

it('returns FedRAMP and HIPAA control catalog', function () {
    [$user, $ws] = bootstrapComplianceOwner();
    $this->actingAs($user, 'web');

    $resp = $this->withHeader('X-Workspace-Id', $ws->id)
        ->getJson('/api/v1/compliance/controls?framework=fedramp_moderate')
        ->assertOk();

    expect(count($resp->json('data')))->toBeGreaterThan(0);
    expect(collect($resp->json('data'))->pluck('control_id'))->toContain('AC-2', 'IA-2', 'SC-28');
});

it('records a workspace attestation and updates summary coverage', function () {
    [$user, $ws] = bootstrapComplianceOwner();
    $this->actingAs($user, 'web');

    $control = ComplianceControl::query()
        ->where('framework', 'hipaa_security')
        ->where('control_id', '164.312(a)(1)')
        ->firstOrFail();

    $this->withHeader('X-Workspace-Id', $ws->id)
        ->postJson('/api/v1/compliance/attestations', [
            'control_id' => $control->id,
            'status'     => 'implemented',
            'notes'      => 'RBAC + MFA enforced.',
            'evidence'   => ['policy_doc' => 's3://aaop-evidence/access-control.pdf'],
        ])
        ->assertCreated();

    $summary = $this->withHeader('X-Workspace-Id', $ws->id)
        ->getJson('/api/v1/compliance/summary')
        ->assertOk()
        ->json();

    $hipaa = collect($summary['frameworks'])->firstWhere('framework', 'hipaa_security');
    expect($hipaa)->not->toBeNull();
    expect($hipaa['controls_covered'])->toBeGreaterThanOrEqual(1);
    expect($hipaa['by_status']['implemented'])->toBeGreaterThanOrEqual(1);
});

it('upserts a data retention policy with legal hold', function () {
    [$user, $ws] = bootstrapComplianceOwner();
    $this->actingAs($user, 'web');

    $this->withHeader('X-Workspace-Id', $ws->id)
        ->postJson('/api/v1/compliance/retention', [
            'data_class'     => 'screenshots',
            'retention_days' => 90,
            'legal_hold'     => false,
            'justification'  => ['gdpr_article' => '5(1)(e)'],
        ])
        ->assertCreated()
        ->assertJsonPath('retention_days', 90);

    $this->withHeader('X-Workspace-Id', $ws->id)
        ->postJson('/api/v1/compliance/retention', [
            'data_class'     => 'screenshots',
            'retention_days' => 30,
            'legal_hold'     => true,
        ])
        ->assertOk()
        ->assertJsonPath('legal_hold', true);

    $rows = $this->withHeader('X-Workspace-Id', $ws->id)
        ->getJson('/api/v1/compliance/retention')
        ->assertOk()
        ->json('data');
    expect($rows)->toHaveCount(1);
});
