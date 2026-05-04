<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Workspaces (tenants) + memberships table — PRD §19.2.
 *
 * `region` powers data-residency routing (T-F02-10, T-F15-04).
 * `plan` will be wired to billing tiers (PRD §33.1).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workspaces', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('plan', 32)->default('free');     // free | pro | team | enterprise
            $table->string('region', 32)->default('us-ashburn-1');
            $table->json('settings')->nullable();
            $table->timestamps();
        });

        Schema::create('memberships', function (Blueprint $table) {
            $table->uuid('user_id');
            $table->uuid('workspace_id');
            $table->string('role', 16);  // owner | admin | editor | runner | viewer
            $table->timestamps();

            $table->primary(['user_id', 'workspace_id']);
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('workspace_id')->references('id')->on('workspaces')->cascadeOnDelete();
            $table->index(['workspace_id', 'role']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('memberships');
        Schema::dropIfExists('workspaces');
    }
};
