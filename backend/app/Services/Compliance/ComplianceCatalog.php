<?php

namespace App\Services\Compliance;

use App\Models\ComplianceAttestation;
use App\Models\ComplianceControl;
use App\Models\Workspace;
use Illuminate\Support\Facades\DB;

/**
 * Catalog seeder + summary for FedRAMP Moderate, HIPAA Security and SOC2.
 * Seeded once on first read so feature tests start with a known catalog.
 */
class ComplianceCatalog
{
    public const SEED_CONTROLS = [
        // --- FedRAMP Moderate (subset of common controls) ---
        ['fedramp_moderate', 'AC-2',          'Account Management',                   'Manage information system accounts including establishment, activation, modification, review, disabling, and removal.'],
        ['fedramp_moderate', 'AC-6',          'Least Privilege',                      'Employ the principle of least privilege; allow only authorised access necessary to accomplish assigned tasks.'],
        ['fedramp_moderate', 'AU-2',          'Audit Events',                         'Determine that the information system is capable of auditing security-relevant events.'],
        ['fedramp_moderate', 'AU-12',         'Audit Generation',                     'Provide audit record generation capability for the auditable events.'],
        ['fedramp_moderate', 'IA-2',          'Identification & Authentication',      'Uniquely identify and authenticate organisational users.'],
        ['fedramp_moderate', 'IA-2(1)',       'Multi-factor for Privileged Accounts', 'MFA required for privileged accounts.'],
        ['fedramp_moderate', 'SC-8',          'Transmission Confidentiality',         'Protect the confidentiality and integrity of transmitted information.'],
        ['fedramp_moderate', 'SC-12',         'Cryptographic Key Establishment',      'Establish and manage cryptographic keys.'],
        ['fedramp_moderate', 'SC-28',         'Protection of Information at Rest',    'Protect the confidentiality and integrity of information at rest.'],
        ['fedramp_moderate', 'SI-4',          'Information System Monitoring',        'Monitor the information system to detect attacks and indicators of potential attacks.'],
        ['fedramp_moderate', 'CP-9',          'Information System Backup',            'Conduct backups of user-level, system-level, and security-related information.'],
        ['fedramp_moderate', 'IR-4',          'Incident Handling',                    'Implement an incident handling capability for security incidents.'],

        // --- HIPAA Security Rule (administrative/technical/physical) ---
        ['hipaa_security', '164.308(a)(1)',   'Security Management Process',          'Implement policies and procedures to prevent, detect, contain, and correct security violations.'],
        ['hipaa_security', '164.308(a)(3)',   'Workforce Security',                   'Ensure all members of workforce have appropriate access to ePHI and prevent those who do not.'],
        ['hipaa_security', '164.308(a)(5)',   'Security Awareness & Training',        'Implement a security awareness and training program.'],
        ['hipaa_security', '164.312(a)(1)',   'Access Control',                       'Implement technical policies and procedures to allow access only to authorised persons.'],
        ['hipaa_security', '164.312(b)',      'Audit Controls',                       'Implement hardware, software, and procedural mechanisms to record and examine activity.'],
        ['hipaa_security', '164.312(c)(1)',   'Integrity',                            'Implement policies to protect ePHI from improper alteration or destruction.'],
        ['hipaa_security', '164.312(d)',      'Person or Entity Authentication',      'Implement procedures to verify that a person seeking access is the one claimed.'],
        ['hipaa_security', '164.312(e)(1)',   'Transmission Security',                'Implement technical security measures to guard against unauthorised access to ePHI in transit.'],
        ['hipaa_security', '164.314(a)',      'Business Associate Contracts',         'Obtain satisfactory assurances from business associates.'],
        ['hipaa_security', '164.316(b)(1)',   'Documentation',                        'Maintain written (or electronic) policies and procedures.'],

        // --- SOC2 Common Criteria (mapping bridge) ---
        ['soc2', 'CC6.1',  'Logical & Physical Access',       'Logical and physical access controls restrict unauthorised access.'],
        ['soc2', 'CC6.6',  'Network Segmentation',            'Network segmentation prevents unauthorised lateral movement.'],
        ['soc2', 'CC7.2',  'System Monitoring',               'Continuously monitor for indicators of compromise.'],
        ['soc2', 'CC8.1',  'Change Management',               'Authorise, design, develop, configure, document, test, approve and implement changes.'],
    ];

    public function ensureSeeded(): void
    {
        if (ComplianceControl::query()->count() > 0) {
            return;
        }
        $now = now();
        $rows = [];
        foreach (self::SEED_CONTROLS as [$framework, $controlId, $title, $description]) {
            $rows[] = [
                'id'             => (string) \Illuminate\Support\Str::uuid(),
                'framework'      => $framework,
                'control_id'     => $controlId,
                'title'          => $title,
                'description'    => $description,
                'mappings'       => null,
                'default_status' => 'not_assessed',
                'created_at'     => $now,
                'updated_at'     => $now,
            ];
        }
        DB::table('compliance_controls')->insertOrIgnore($rows);
    }

    /**
     * Returns per-framework coverage for the workspace.
     * @return array<int, array<string,mixed>>
     */
    public function summary(Workspace $workspace): array
    {
        $this->ensureSeeded();

        $counts = ComplianceControl::query()
            ->selectRaw('framework, COUNT(*) AS total')
            ->groupBy('framework')
            ->pluck('total', 'framework');

        $attested = ComplianceAttestation::query()
            ->where('compliance_attestations.workspace_id', $workspace->id)
            ->join('compliance_controls', 'compliance_controls.id', '=', 'compliance_attestations.control_id')
            ->selectRaw('compliance_controls.framework, compliance_attestations.status, COUNT(*) AS n')
            ->groupBy('compliance_controls.framework', 'compliance_attestations.status')
            ->get()
            ->groupBy('framework');

        $out = [];
        foreach ($counts as $framework => $total) {
            $byStatus = ['implemented' => 0, 'partial' => 0, 'not_assessed' => 0, 'not_applicable' => 0];
            foreach ($attested[$framework] ?? [] as $row) {
                $byStatus[$row->status] = (int) $row->n;
            }
            $covered = $byStatus['implemented'] + $byStatus['partial'];
            $out[] = [
                'framework'        => $framework,
                'controls_total'   => (int) $total,
                'controls_attested'=> array_sum($byStatus),
                'controls_covered' => $covered,
                'coverage_percent' => $total > 0 ? round(100 * $covered / $total, 1) : 0.0,
                'by_status'        => $byStatus,
            ];
        }
        return $out;
    }
}
