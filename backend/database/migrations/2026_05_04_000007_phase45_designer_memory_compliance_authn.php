<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 4-5 schema:
 *  - memory_items                    Memory store (workspace-scoped, JSON-backed)
 *  - compliance_controls             FedRAMP / HIPAA control catalog
 *  - compliance_attestations         per-workspace attestations of controls
 *  - data_retention_policies         per-workspace data class TTLs
 *  - oauth_identities                SSO provider linkage (OIDC)
 *  - webauthn_credentials            FIDO2 / WebAuthn keys per user
 *
 * `ui_mappings` already exists from the Phase 1 governance migration; we
 * extend it here with vector_embedding (JSON) and last_heal_at columns
 * needed for the Memory & UI-Mapping store work.
 */
return new class extends Migration
{
    public function up(): void
    {
        // ---------------------------------------------------------------
        // ui_mappings — extend with embedding + last_heal_at for Memory loop
        // ---------------------------------------------------------------
        Schema::table('ui_mappings', function (Blueprint $table) {
            if (! Schema::hasColumn('ui_mappings', 'vector_embedding')) {
                $table->json('vector_embedding')->nullable()->after('confidence');
            }
            if (! Schema::hasColumn('ui_mappings', 'last_heal_at')) {
                $table->timestamp('last_heal_at')->nullable()->after('last_seen_at');
            }
            if (! Schema::hasColumn('ui_mappings', 'source')) {
                $table->string('source', 32)->default('observed')->after('selector');
            }
        });

        // ---------------------------------------------------------------
        // memory_items — episodic / semantic / procedural memory
        // ---------------------------------------------------------------
        Schema::create('memory_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('workspace_id');
            $table->uuid('user_id')->nullable();
            $table->string('kind', 32);                    // episodic | semantic | procedural | preference
            $table->string('namespace', 80)->default('default');
            $table->string('key', 255);
            $table->json('content');                       // arbitrary payload
            $table->json('tags')->nullable();
            $table->json('vector_embedding')->nullable(); // placeholder until pgvector
            $table->decimal('relevance', 5, 4)->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->foreign('workspace_id')->references('id')->on('workspaces')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
            $table->unique(['workspace_id', 'namespace', 'key']);
            $table->index(['workspace_id', 'kind']);
        });

        // ---------------------------------------------------------------
        // compliance_controls — FedRAMP Moderate / HIPAA / SOC2 catalog
        // ---------------------------------------------------------------
        Schema::create('compliance_controls', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('framework', 32);               // fedramp_moderate | hipaa_security | soc2 | iso_27001
            $table->string('control_id', 32);              // e.g. AC-2, 164.308(a)(1), CC6.1
            $table->string('title', 255);
            $table->text('description')->nullable();
            $table->json('mappings')->nullable();          // cross-framework references
            $table->string('default_status', 16)->default('not_assessed'); // implemented | partial | not_assessed | not_applicable
            $table->timestamps();

            $table->unique(['framework', 'control_id']);
            $table->index('framework');
        });

        // ---------------------------------------------------------------
        // compliance_attestations — workspace-level evidence
        // ---------------------------------------------------------------
        Schema::create('compliance_attestations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('workspace_id');
            $table->uuid('control_id');
            $table->string('status', 16);                  // implemented | partial | not_assessed | not_applicable
            $table->text('notes')->nullable();
            $table->json('evidence')->nullable();          // artifact refs
            $table->uuid('attested_by')->nullable();
            $table->timestamp('attested_at')->nullable();
            $table->timestamps();

            $table->foreign('workspace_id')->references('id')->on('workspaces')->cascadeOnDelete();
            $table->foreign('control_id')->references('id')->on('compliance_controls')->cascadeOnDelete();
            $table->foreign('attested_by')->references('id')->on('users')->nullOnDelete();
            $table->unique(['workspace_id', 'control_id'], 'uq_attest_ws_ctrl');
            $table->index(['workspace_id', 'status'], 'idx_attest_ws_status');
        });

        // ---------------------------------------------------------------
        // data_retention_policies — GDPR / HIPAA-driven retention
        // ---------------------------------------------------------------
        Schema::create('data_retention_policies', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('workspace_id');
            $table->string('data_class', 64);              // run_logs | screenshots | audit | memory | exports
            $table->unsignedInteger('retention_days');
            $table->boolean('legal_hold')->default(false);
            $table->json('justification')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->timestamps();

            $table->foreign('workspace_id')->references('id')->on('workspaces')->cascadeOnDelete();
            $table->foreign('updated_by')->references('id')->on('users')->nullOnDelete();
            $table->unique(['workspace_id', 'data_class'], 'uq_retention_ws_class');
        });

        // ---------------------------------------------------------------
        // oauth_identities — federated SSO linkage (OIDC)
        // ---------------------------------------------------------------
        Schema::create('oauth_identities', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->string('provider', 32);               // google | microsoft | okta | github
            $table->string('provider_user_id', 255);
            $table->string('email', 255)->nullable();
            $table->json('claims')->nullable();
            $table->timestamp('linked_at')->useCurrent();
            $table->timestamp('last_login_at')->nullable();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->unique(['provider', 'provider_user_id'], 'uq_oauth_ident');
            $table->index('user_id');
        });

        // ---------------------------------------------------------------
        // webauthn_credentials — FIDO2 / passkey credentials
        // ---------------------------------------------------------------
        Schema::create('webauthn_credentials', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->string('credential_id', 512);          // base64url-encoded raw id
            $table->longText('public_key');                // CBOR-encoded
            $table->unsignedBigInteger('counter')->default(0);
            $table->string('aaguid', 64)->nullable();
            $table->json('transports')->nullable();
            $table->string('attestation_format', 32)->nullable();
            $table->string('label', 80)->nullable();       // user-friendly nickname
            $table->timestamp('last_used_at')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->unique('credential_id', 'uq_webauthn_cred');
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('webauthn_credentials');
        Schema::dropIfExists('oauth_identities');
        Schema::dropIfExists('data_retention_policies');
        Schema::dropIfExists('compliance_attestations');
        Schema::dropIfExists('compliance_controls');
        Schema::dropIfExists('memory_items');

        Schema::table('ui_mappings', function (Blueprint $table) {
            if (Schema::hasColumn('ui_mappings', 'vector_embedding')) {
                $table->dropColumn('vector_embedding');
            }
            if (Schema::hasColumn('ui_mappings', 'last_heal_at')) {
                $table->dropColumn('last_heal_at');
            }
            if (Schema::hasColumn('ui_mappings', 'source')) {
                $table->dropColumn('source');
            }
        });
    }
};
