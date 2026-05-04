<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Workflows + versions — system of record for orchestration definitions.
 * Mirrors PRD §19.2 (workflows, workflow_versions). The graph JSON column
 * matches the canonical schema in PRD §19.3.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workflows', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('workspace_id');
            $table->string('name', 80);
            $table->text('description')->nullable();
            $table->uuid('current_version_id')->nullable();
            $table->string('status', 16)->default('draft');  // draft | review | published | archived
            $table->string('environment', 16)->default('draft'); // draft | staging | production
            $table->json('tags')->nullable();
            $table->uuid('created_by')->nullable();
            $table->timestamps();

            $table->foreign('workspace_id')->references('id')->on('workspaces')->cascadeOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->index(['workspace_id', 'status']);
            $table->index(['workspace_id', 'environment']);
        });

        Schema::create('workflow_versions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('workflow_id');
            $table->unsignedInteger('version');
            $table->json('graph');                // canonical workflow graph (PRD §19.3)
            $table->json('langgraph_config')->nullable();
            $table->string('hash', 64);           // sha256 of `graph` for integrity
            $table->uuid('created_by')->nullable();
            $table->timestamps();

            $table->unique(['workflow_id', 'version']);
            $table->foreign('workflow_id')->references('id')->on('workflows')->cascadeOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
        });

        // Per-workflow ACL overrides (PRD §17.6 FR-A10 / FR-F1)
        Schema::create('workflow_acls', function (Blueprint $table) {
            $table->uuid('workflow_id');
            $table->uuid('user_id');
            $table->string('permission', 8); // read | edit | run
            $table->timestamps();

            $table->primary(['workflow_id', 'user_id']);
            $table->foreign('workflow_id')->references('id')->on('workflows')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workflow_acls');
        Schema::dropIfExists('workflow_versions');
        Schema::dropIfExists('workflows');
    }
};
