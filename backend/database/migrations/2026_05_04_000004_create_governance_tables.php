<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Governance: secrets refs, policies, approvals, audit log, ui mappings.
 * Mirrors PRD §19.2 (with MySQL-friendly type adjustments).
 */
return new class extends Migration
{
    public function up(): void
    {
        // ---------------------------------------------------------------
        // Secrets — only references are stored locally; values live in vault
        // ---------------------------------------------------------------
        Schema::create('secrets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('workspace_id');
            $table->string('name', 80);
            $table->string('vault_ref', 255);
            $table->string('rotation_policy', 32)->nullable();
            $table->json('metadata')->nullable();
            $table->uuid('created_by')->nullable();
            $table->timestamps();

            $table->unique(['workspace_id', 'name']);
            $table->foreign('workspace_id')->references('id')->on('workspaces')->cascadeOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
        });

        // ---------------------------------------------------------------
        // Policies — design / deploy / runtime gates (OPA Rego or schema)
        // ---------------------------------------------------------------
        Schema::create('policies', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('workspace_id');
            $table->string('name', 120);
            $table->string('scope', 16);                    // workspace | workflow | environment
            $table->uuid('scope_id')->nullable();
            $table->longText('rego')->nullable();           // OPA source (optional)
            $table->json('schema')->nullable();             // structured rule definition
            $table->json('enforced_at');                    // ['design','deploy','run']
            $table->unsignedSmallInteger('version');
            $table->boolean('enabled')->default(true);
            $table->uuid('created_by')->nullable();
            $table->timestamps();

            $table->foreign('workspace_id')->references('id')->on('workspaces')->cascadeOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->index(['workspace_id', 'scope', 'scope_id']);
        });

        // ---------------------------------------------------------------
        // Approvals — Approval Center (PRD §17.6 FR-F2 / T-F12-05)
        // ---------------------------------------------------------------
        Schema::create('approval_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('workspace_id');
            $table->uuid('run_id')->nullable();
            $table->string('node_id', 64)->nullable();
            $table->string('risk_class', 16);               // low|medium|high|critical
            $table->unsignedTinyInteger('required_approvers')->default(1);
            $table->string('status', 16)->default('pending'); // pending|approved|rejected|expired
            $table->timestamp('sla_deadline')->nullable();
            $table->json('context')->nullable();
            $table->uuid('created_by')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->foreign('workspace_id')->references('id')->on('workspaces')->cascadeOnDelete();
            $table->foreign('run_id')->references('id')->on('runs')->nullOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->index(['workspace_id', 'status']);
            $table->index(['status', 'sla_deadline']);
        });

        Schema::create('approval_decisions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('request_id');
            $table->uuid('approver_id');
            $table->string('decision', 16);                 // approved|rejected
            $table->text('reason')->nullable();
            $table->timestamp('decided_at')->useCurrent();

            $table->foreign('request_id')->references('id')->on('approval_requests')->cascadeOnDelete();
            $table->foreign('approver_id')->references('id')->on('users')->cascadeOnDelete();
            $table->index('request_id');
        });

        // ---------------------------------------------------------------
        // Audit log — append-only, hash-chained (PRD §17.6 FR-F4 / T-F12-07)
        // ---------------------------------------------------------------
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->uuid('workspace_id')->nullable();
            $table->uuid('actor_id')->nullable();
            $table->string('actor_type', 32)->default('user');
            $table->string('action', 80);                   // e.g. workflow.create, run.start
            $table->string('target_type', 32)->nullable();
            $table->uuid('target_id')->nullable();
            $table->json('meta')->nullable();
            $table->string('hash_chain', 64)->index();     // sha256 chain for tamper detection
            $table->timestamp('created_at')->useCurrent();

            $table->index(['workspace_id', 'action']);
            $table->index(['target_type', 'target_id']);
        });

        // ---------------------------------------------------------------
        // UI mappings — self-healing memory (PRD §19.2 / T-F03-03)
        // ---------------------------------------------------------------
        Schema::create('ui_mappings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('workspace_id');
            $table->string('app_url', 512);
            $table->string('page_signature', 64)->nullable();
            $table->string('element_label', 255);
            $table->text('selector')->nullable();
            $table->json('bbox')->nullable();
            $table->decimal('confidence', 4, 3)->nullable();
            $table->unsignedInteger('observed_count')->default(1);
            $table->timestamp('last_seen_at')->useCurrent();
            $table->timestamps();

            $table->foreign('workspace_id')->references('id')->on('workspaces')->cascadeOnDelete();
            $table->index(['workspace_id', 'app_url'], 'idx_uimap_lookup');
        });

        // ---------------------------------------------------------------
        // LangGraph checkpoints (PRD §19.2 / T-F03-08)
        // ---------------------------------------------------------------
        Schema::create('langgraph_checkpoints', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('run_id');
            $table->string('checkpoint_id', 64);
            $table->string('thread_id', 64);
            $table->json('state');
            $table->timestamps();

            $table->foreign('run_id')->references('id')->on('runs')->cascadeOnDelete();
            $table->index(['run_id', 'thread_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('langgraph_checkpoints');
        Schema::dropIfExists('ui_mappings');
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('approval_decisions');
        Schema::dropIfExists('approval_requests');
        Schema::dropIfExists('policies');
        Schema::dropIfExists('secrets');
    }
};
