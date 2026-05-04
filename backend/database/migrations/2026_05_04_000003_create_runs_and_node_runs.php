<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Runs + per-node runs — execution telemetry root (PRD §19.2).
 * Includes cost tracking, sandbox bookkeeping, and Healenium fields
 * required for self-healing analytics (T-F10-07).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('runs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('workspace_id');
            $table->uuid('workflow_id');
            $table->uuid('version_id');
            $table->string('status', 16);                 // queued|running|succeeded|failed|paused|cancelled|awaiting_approval
            $table->string('trigger', 16);                // manual|schedule|webhook|api
            $table->string('environment', 16)->default('draft');
            $table->string('preferred_engine', 16)->default('auto');
            $table->json('inputs')->nullable();
            $table->json('outputs')->nullable();
            $table->text('error')->nullable();
            $table->decimal('cost_credits', 12, 4)->default(0);
            $table->string('sandbox_id', 64)->nullable();
            $table->string('langgraph_checkpoint', 64)->nullable();
            $table->string('correlation_id', 64)->nullable()->index();
            $table->uuid('triggered_by')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->unsignedInteger('duration_ms')->nullable();
            $table->timestamps();

            $table->foreign('workspace_id')->references('id')->on('workspaces')->cascadeOnDelete();
            $table->foreign('workflow_id')->references('id')->on('workflows')->cascadeOnDelete();
            $table->foreign('version_id')->references('id')->on('workflow_versions')->cascadeOnDelete();
            $table->foreign('triggered_by')->references('id')->on('users')->nullOnDelete();
            $table->index(['workspace_id', 'status']);
            $table->index(['workflow_id', 'status']);
        });

        Schema::create('node_runs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('run_id');
            $table->string('node_id', 64);
            $table->string('engine', 32);                // playwright|vision|mcp|activepieces|langgraph|hitl
            $table->string('status', 16);                // queued|running|succeeded|failed|skipped|healed
            $table->unsignedSmallInteger('attempt')->default(1);
            $table->json('input')->nullable();
            $table->json('output')->nullable();
            $table->text('error')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->unsignedInteger('duration_ms')->nullable();
            $table->string('screenshot_url', 512)->nullable();
            $table->boolean('healed')->default(false);
            $table->boolean('healenium_remap')->default(false);
            $table->json('heal_diff')->nullable();        // before/after selectors + screenshots
            $table->timestamps();

            $table->foreign('run_id')->references('id')->on('runs')->cascadeOnDelete();
            $table->index(['run_id', 'status']);
            $table->index(['run_id', 'node_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('node_runs');
        Schema::dropIfExists('runs');
    }
};
