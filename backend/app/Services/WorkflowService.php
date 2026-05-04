<?php

namespace App\Services;

use App\Models\User;
use App\Models\Workflow;
use App\Models\WorkflowVersion;
use App\Models\Workspace;
use Illuminate\Support\Facades\DB;

/**
 * Workflow domain service: handles creation, version save, restore, and
 * promotion. Every mutation emits a hash-chained audit event so we have
 * a complete provenance record (PRD §17.1).
 */
class WorkflowService
{
    public function __construct(
        private readonly AuditLogger $audit,
    ) {
    }

    /**
     * Create a new workflow with an initial empty version (FR-A1, T-F05-10).
     */
    public function create(Workspace $workspace, User $actor, string $name, ?string $description = null, ?array $tags = null): Workflow
    {
        return DB::transaction(function () use ($workspace, $actor, $name, $description, $tags) {

            $resolvedName = $this->ensureUniqueName($workspace, $name);

            /** @var Workflow $workflow */
            $workflow = Workflow::query()->create([
                'workspace_id' => $workspace->id,
                'name'         => $resolvedName,
                'description'  => $description,
                'status'       => 'draft',
                'environment'  => 'draft',
                'tags'         => $tags,
                'created_by'   => $actor->id,
            ]);

            $version = $this->saveVersion($workflow, $actor, [
                'schema_version' => '1.0',
                'name'           => $resolvedName,
                'nodes'          => [],
                'edges'          => [],
                'policies'       => [],
            ]);

            $workflow->update(['current_version_id' => $version->id]);

            $this->audit->record(
                workspaceId: $workspace->id,
                actorId: $actor->id,
                actorType: 'user',
                action: 'workflow.create',
                targetType: 'workflow',
                targetId: $workflow->id,
                meta: ['name' => $resolvedName, 'version' => 1],
            );

            return $workflow->fresh(['currentVersion']);
        });
    }

    /**
     * Persist a new version of the workflow's graph (FR-A8, T-F04-06).
     */
    public function saveVersion(Workflow $workflow, User $actor, array $graph, ?array $langgraphConfig = null): WorkflowVersion
    {
        return DB::transaction(function () use ($workflow, $actor, $graph, $langgraphConfig) {
            $next = ((int) $workflow->versions()->max('version')) + 1;
            $hash = hash('sha256', json_encode($graph, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));

            /** @var WorkflowVersion $version */
            $version = WorkflowVersion::query()->create([
                'workflow_id'      => $workflow->id,
                'version'          => $next,
                'graph'            => $graph,
                'langgraph_config' => $langgraphConfig,
                'hash'             => $hash,
                'created_by'       => $actor->id,
            ]);

            $workflow->update([
                'current_version_id' => $version->id,
                'updated_at'         => now(),
            ]);

            $this->audit->record(
                workspaceId: $workflow->workspace_id,
                actorId: $actor->id,
                actorType: 'user',
                action: 'workflow.version.save',
                targetType: 'workflow',
                targetId: $workflow->id,
                meta: ['version' => $next, 'hash' => $hash, 'nodes' => count($graph['nodes'] ?? [])],
            );

            return $version;
        });
    }

    /**
     * Restore an older version → emits a *new* version equal to the chosen
     * one (FR-A8 acceptance criteria).
     */
    public function restoreVersion(Workflow $workflow, User $actor, int $version): WorkflowVersion
    {
        $source = $workflow->versions()->where('version', $version)->firstOrFail();

        $restored = $this->saveVersion(
            workflow: $workflow,
            actor: $actor,
            graph: $source->graph,
            langgraphConfig: $source->langgraph_config,
        );

        $this->audit->record(
            workspaceId: $workflow->workspace_id,
            actorId: $actor->id,
            actorType: 'user',
            action: 'workflow.version.restore',
            targetType: 'workflow',
            targetId: $workflow->id,
            meta: ['restored_from' => $version, 'new_version' => $restored->version],
        );

        return $restored;
    }

    /**
     * Promote a workflow to a target environment (draft|staging|production).
     * Real policy gates are wired in Phase 3 (T-F12-03); for now we run a
     * minimal sanity check and emit audit.
     */
    public function promote(Workflow $workflow, User $actor, string $targetEnvironment): Workflow
    {
        $targetEnvironment = in_array($targetEnvironment, ['draft', 'staging', 'production'], true)
            ? $targetEnvironment
            : 'draft';

        $previous = $workflow->environment;
        $workflow->update([
            'environment' => $targetEnvironment,
            'status'      => $targetEnvironment === 'production' ? 'published' : $workflow->status,
        ]);

        $this->audit->record(
            workspaceId: $workflow->workspace_id,
            actorId: $actor->id,
            actorType: 'user',
            action: 'workflow.promote',
            targetType: 'workflow',
            targetId: $workflow->id,
            meta: ['from' => $previous, 'to' => $targetEnvironment],
        );

        return $workflow->fresh();
    }

    /**
     * Resolves the FR-A1 edge case: append " (n)" until unique inside the workspace.
     */
    protected function ensureUniqueName(Workspace $workspace, string $name): string
    {
        $base = trim($name);
        $candidate = $base;
        $counter = 1;

        while (Workflow::query()
            ->where('workspace_id', $workspace->id)
            ->where('name', $candidate)
            ->exists()
        ) {
            $counter++;
            $candidate = $base.' ('.$counter.')';
        }

        return $candidate;
    }
}
