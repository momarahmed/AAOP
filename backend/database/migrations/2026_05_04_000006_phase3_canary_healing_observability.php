<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 3 — F09 canary routing metadata, F10 heal audit trail, run telemetry hooks.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('workflows', function (Blueprint $table) {
            $table->unsignedTinyInteger('canary_percent')->default(0)->after('environment');
            $table->uuid('canary_version_id')->nullable()->after('canary_percent');
            $table->foreign('canary_version_id')->references('id')->on('workflow_versions')->nullOnDelete();
        });

        Schema::table('runs', function (Blueprint $table) {
            $table->string('deployment_lane', 16)->nullable()->after('version_id'); // stable|canary
            $table->json('routing_meta')->nullable()->after('deployment_lane');
        });

        Schema::create('heal_attempts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('workspace_id');
            $table->uuid('run_id')->nullable();
            $table->uuid('node_run_id')->nullable();
            $table->string('failure_signal', 64);              // selector_not_found|timeout|visual_fail|modal|unknown
            $table->string('strategy', 32);                     // retry|healenium|vision|wait|replan|human
            $table->string('status', 16)->default('attempted'); // attempted|succeeded|failed|skipped
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->foreign('workspace_id')->references('id')->on('workspaces')->cascadeOnDelete();
            $table->foreign('run_id')->references('id')->on('runs')->nullOnDelete();
            $table->foreign('node_run_id')->references('id')->on('node_runs')->nullOnDelete();
            $table->index(['workspace_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('heal_attempts');

        Schema::table('runs', function (Blueprint $table) {
            $table->dropColumn(['deployment_lane', 'routing_meta']);
        });

        Schema::table('workflows', function (Blueprint $table) {
            $table->dropForeign(['canary_version_id']);
            $table->dropColumn(['canary_percent', 'canary_version_id']);
        });
    }
};
