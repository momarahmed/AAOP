<?php

namespace App\Providers;

use App\Models\Workflow;
use App\Models\Workspace;
use App\Support\Rbac\Roles;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

/**
 * AAOP RBAC gate registrations.
 *
 * Roles (PRD §17.6 FR-F1):
 *   owner | admin | editor | runner | viewer
 *
 * Workflow ACL overrides per workspace are layered on top via
 * Workflow::aclFor($user) → 'read' | 'edit' | 'run' | null
 */
class AuthServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        // Workspace-scoped abilities ------------------------------------
        Gate::define('workspace.manage', function ($user, Workspace $workspace) {
            return in_array($workspace->roleFor($user), [Roles::OWNER, Roles::ADMIN], true);
        });

        Gate::define('workspace.view', function ($user, Workspace $workspace) {
            return $workspace->roleFor($user) !== null;
        });

        // Workflow-scoped abilities -------------------------------------
        Gate::define('workflow.view', function ($user, Workflow $workflow) {
            $role = $workflow->workspace->roleFor($user);
            $acl  = $workflow->aclFor($user);
            return $role !== null || $acl !== null;
        });

        Gate::define('workflow.edit', function ($user, Workflow $workflow) {
            $role = $workflow->workspace->roleFor($user);
            if (in_array($role, [Roles::OWNER, Roles::ADMIN, Roles::EDITOR], true)) {
                return true;
            }
            return $workflow->aclFor($user) === 'edit';
        });

        Gate::define('workflow.run', function ($user, Workflow $workflow) {
            $role = $workflow->workspace->roleFor($user);
            if (in_array($role, [Roles::OWNER, Roles::ADMIN, Roles::EDITOR, Roles::RUNNER], true)) {
                return true;
            }
            return in_array($workflow->aclFor($user), ['edit', 'run'], true);
        });

        Gate::define('workflow.delete', function ($user, Workflow $workflow) {
            return in_array($workflow->workspace->roleFor($user), [Roles::OWNER, Roles::ADMIN], true);
        });
    }
}
