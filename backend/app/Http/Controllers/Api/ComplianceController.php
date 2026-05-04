<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ComplianceAttestation;
use App\Models\ComplianceControl;
use App\Models\DataRetentionPolicy;
use App\Models\Workspace;
use App\Services\AuditLogger;
use App\Services\Compliance\ComplianceCatalog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Compliance API (Phase 4-5).
 *
 *   GET  /v1/compliance/controls                — global catalog (FedRAMP / HIPAA / SOC2)
 *   GET  /v1/compliance/attestations            — workspace attestations
 *   POST /v1/compliance/attestations            — upsert attestation for control
 *   GET  /v1/compliance/retention               — retention policies for workspace
 *   POST /v1/compliance/retention               — upsert retention policy
 *   GET  /v1/compliance/summary                 — coverage summary by framework
 */
class ComplianceController extends Controller
{
    public function __construct(
        private readonly AuditLogger $audit,
        private readonly ComplianceCatalog $catalog,
    ) {
    }

    public function controls(Request $request): JsonResponse
    {
        $framework = $request->query('framework');
        $q = ComplianceControl::query()->orderBy('framework')->orderBy('control_id');
        if ($framework) {
            $q->where('framework', $framework);
        }
        return response()->json([
            'data' => $q->get()->map(fn (ComplianceControl $c) => [
                'id'             => $c->id,
                'framework'      => $c->framework,
                'control_id'     => $c->control_id,
                'title'          => $c->title,
                'description'    => $c->description,
                'mappings'       => $c->mappings ?? [],
                'default_status' => $c->default_status,
            ]),
        ]);
    }

    public function attestations(Request $request): JsonResponse
    {
        /** @var Workspace $workspace */
        $workspace = $request->attributes->get('workspace');

        $rows = ComplianceAttestation::query()
            ->where('workspace_id', $workspace->id)
            ->with('control')
            ->get()
            ->map(fn (ComplianceAttestation $a) => [
                'id'           => $a->id,
                'control'      => [
                    'framework'  => $a->control?->framework,
                    'control_id' => $a->control?->control_id,
                    'title'      => $a->control?->title,
                ],
                'status'       => $a->status,
                'notes'        => $a->notes,
                'evidence'     => $a->evidence ?? [],
                'attested_by'  => $a->attested_by,
                'attested_at'  => $a->attested_at?->toIso8601String(),
                'updated_at'   => $a->updated_at?->toIso8601String(),
            ]);

        return response()->json(['data' => $rows]);
    }

    public function attest(Request $request): JsonResponse
    {
        /** @var Workspace $workspace */
        $workspace = $request->attributes->get('workspace');

        $data = $request->validate([
            'control_id' => ['required', 'string', 'exists:compliance_controls,id'],
            'status'     => ['required', 'string', 'in:implemented,partial,not_assessed,not_applicable'],
            'notes'      => ['nullable', 'string', 'max:4000'],
            'evidence'   => ['nullable', 'array'],
        ]);

        $attest = ComplianceAttestation::query()->updateOrCreate(
            [
                'workspace_id' => $workspace->id,
                'control_id'   => $data['control_id'],
            ],
            [
                'status'      => $data['status'],
                'notes'       => $data['notes'] ?? null,
                'evidence'    => $data['evidence'] ?? null,
                'attested_by' => $request->user()->id,
                'attested_at' => now(),
            ]
        );

        $this->audit->record(
            workspaceId: $workspace->id,
            actorId: $request->user()->id,
            actorType: 'user',
            action: 'compliance.attest',
            targetType: 'compliance_attestation',
            targetId: $attest->id,
            meta: ['status' => $attest->status, 'control_id' => $attest->control_id],
        );

        return response()->json([
            'id'         => $attest->id,
            'status'     => $attest->status,
            'attested_at'=> $attest->attested_at?->toIso8601String(),
        ], $attest->wasRecentlyCreated ? 201 : 200);
    }

    public function retention(Request $request): JsonResponse
    {
        /** @var Workspace $workspace */
        $workspace = $request->attributes->get('workspace');

        $rows = DataRetentionPolicy::query()
            ->where('workspace_id', $workspace->id)
            ->orderBy('data_class')
            ->get()
            ->map(fn (DataRetentionPolicy $p) => [
                'id'             => $p->id,
                'data_class'     => $p->data_class,
                'retention_days' => $p->retention_days,
                'legal_hold'     => $p->legal_hold,
                'justification'  => $p->justification ?? [],
                'updated_by'     => $p->updated_by,
                'updated_at'     => $p->updated_at?->toIso8601String(),
            ]);

        return response()->json(['data' => $rows]);
    }

    public function setRetention(Request $request): JsonResponse
    {
        /** @var Workspace $workspace */
        $workspace = $request->attributes->get('workspace');

        $data = $request->validate([
            'data_class'     => ['required', 'string', 'max:64'],
            'retention_days' => ['required', 'integer', 'min:0', 'max:36500'],
            'legal_hold'     => ['nullable', 'boolean'],
            'justification'  => ['nullable', 'array'],
        ]);

        $policy = DataRetentionPolicy::query()->updateOrCreate(
            ['workspace_id' => $workspace->id, 'data_class' => $data['data_class']],
            [
                'retention_days' => $data['retention_days'],
                'legal_hold'     => (bool) ($data['legal_hold'] ?? false),
                'justification'  => $data['justification'] ?? null,
                'updated_by'     => $request->user()->id,
            ]
        );

        $this->audit->record(
            workspaceId: $workspace->id,
            actorId: $request->user()->id,
            actorType: 'user',
            action: 'compliance.retention.update',
            targetType: 'data_retention_policy',
            targetId: $policy->id,
            meta: [
                'data_class'     => $policy->data_class,
                'retention_days' => $policy->retention_days,
                'legal_hold'     => $policy->legal_hold,
            ],
        );

        return response()->json([
            'id'             => $policy->id,
            'data_class'     => $policy->data_class,
            'retention_days' => $policy->retention_days,
            'legal_hold'     => $policy->legal_hold,
        ], $policy->wasRecentlyCreated ? 201 : 200);
    }

    public function summary(Request $request): JsonResponse
    {
        /** @var Workspace $workspace */
        $workspace = $request->attributes->get('workspace');

        return response()->json([
            'frameworks' => $this->catalog->summary($workspace),
            'controls_total' => ComplianceControl::query()->count(),
            'attested_total' => ComplianceAttestation::query()
                ->where('workspace_id', $workspace->id)->count(),
        ]);
    }
}
