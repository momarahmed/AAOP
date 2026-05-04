<?php

namespace Database\Seeders;

use App\Models\Membership;
use App\Models\Policy;
use App\Models\User;
use App\Models\Workspace;
use App\Services\AuditLogger;
use App\Services\WorkflowService;
use App\Support\Rbac\Roles;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Bootstraps a demo workspace + sample workflow so the SPA can be
 * exercised end-to-end on a fresh install.
 *
 * Default credentials (dev only — change before deploying):
 *   admin@aaop.local  /  ChangeMe!12345
 *   omar@aaop.local   /  ChangeMe!12345
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::query()->firstOrCreate(
            ['email' => 'admin@aaop.local'],
            [
                'display_name'    => 'Admin',
                'hashed_password' => Hash::make('ChangeMe!12345'),
                'is_admin'        => true,
                'email_verified_at' => now(),
            ]
        );

        $omar = User::query()->firstOrCreate(
            ['email' => 'omar@aaop.local'],
            [
                'display_name'    => 'Operator Omar',
                'hashed_password' => Hash::make('ChangeMe!12345'),
                'email_verified_at' => now(),
            ]
        );

        $atlas = Workspace::query()->firstOrCreate(
            ['slug' => 'atlas-prod'],
            [
                'name'   => 'Atlas Prod',
                'plan'   => 'enterprise',
                'region' => 'us-ashburn-1',
            ]
        );

        $admin->update(['default_workspace_id' => $atlas->id]);
        $omar->update(['default_workspace_id' => $atlas->id]);

        Membership::query()->updateOrCreate(
            ['user_id' => $admin->id, 'workspace_id' => $atlas->id],
            ['role' => Roles::OWNER],
        );
        Membership::query()->updateOrCreate(
            ['user_id' => $omar->id, 'workspace_id' => $atlas->id],
            ['role' => Roles::EDITOR],
        );

        // Demo workflow — based on Appendix A of the PRD
        /** @var WorkflowService $svc */
        $svc = app(WorkflowService::class);

        if (! $atlas->workflows()->where('name', 'Daily Bank Reconciliation')->exists()) {
            $wf = $svc->create(
                workspace: $atlas,
                actor: $admin,
                name: 'Daily Bank Reconciliation',
                description: 'Weekday 09:00 — log into bank, download statement, reconcile, post to #finance.',
                tags: ['finance', 'reconciliation', 'production'],
            );

            $svc->saveVersion($wf, $admin, [
                'schema_version' => '1.0',
                'name' => 'Daily Bank Reconciliation',
                'variables' => ['today' => now()->toDateString()],
                'nodes' => [
                    ['id' => 'trigger_1',          'type' => 'trigger.schedule',           'config' => ['cron' => '0 9 * * 1-5']],
                    ['id' => 'open_bank',          'type' => 'web.open_url',                'config' => ['url' => 'https://bank.example.com']],
                    ['id' => 'login',              'type' => 'web.login',                   'config' => ['username_secret' => 'bank_user', 'password_secret' => 'bank_pass']],
                    ['id' => 'find_statement',     'type' => 'vision.find_element',         'config' => ['description' => "Today's statement download button"]],
                    ['id' => 'download',           'type' => 'web.click',                   'config' => ['target_ref' => 'find_statement.element']],
                    ['id' => 'integration_process','type' => 'integration.activepieces.run','config' => ['piece' => 'custom.reconcile_statement', 'action' => 'process_file', 'inputs' => ['file' => '{{download.path}}']]],
                    ['id' => 'agent_review',       'type' => 'langgraph.agent',             'config' => ['agent_type' => 'reviewer', 'prompt' => 'Review the reconciliation summary...']],
                ],
                'edges' => [
                    ['from' => 'trigger_1',          'to' => 'open_bank'],
                    ['from' => 'open_bank',          'to' => 'login'],
                    ['from' => 'login',              'to' => 'find_statement'],
                    ['from' => 'find_statement',     'to' => 'download'],
                    ['from' => 'download',           'to' => 'integration_process'],
                    ['from' => 'integration_process','to' => 'agent_review'],
                ],
                'policies' => [
                    'on_error'             => 'self_heal',
                    'max_runtime_seconds'  => 600,
                    'retry'                => ['max_attempts' => 3, 'backoff' => 'exponential'],
                    'sandbox'              => ['enabled' => true, 'image' => 'linux-chrome:latest'],
                ],
            ]);
        }

        // Sample policy
        Policy::query()->firstOrCreate(
            ['workspace_id' => $atlas->id, 'name' => 'PII guardrail'],
            [
                'scope' => 'workspace',
                'enforced_at' => ['design', 'deploy', 'run'],
                'version' => 1,
                'enabled' => true,
                'schema' => [
                    'rules' => [
                        ['id' => 'block_external_email', 'description' => 'Disallow sending emails to non-allowlisted domains'],
                        ['id' => 'redact_pii_screenshots', 'description' => 'Redact PII regions in stored screenshots'],
                    ],
                ],
                'created_by' => $admin->id,
            ]
        );

        // Final audit entry
        app(AuditLogger::class)->record(
            workspaceId: $atlas->id,
            actorId: $admin->id,
            actorType: 'system',
            action: 'seed.complete',
            targetType: 'workspace',
            targetId: $atlas->id,
            meta: ['demo_users' => [$admin->email, $omar->email]],
        );
    }
}
