// AAOP API response types (subset of PRD §20). Kept narrow until we
// wire the full OpenAPI spec generator in F04 / Phase 2.

export type Role = 'owner' | 'admin' | 'editor' | 'runner' | 'viewer';

export interface User {
  id: string;
  email: string;
  display_name: string | null;
  is_admin: boolean;
  mfa_enabled: boolean;
  default_workspace_id: string | null;
  last_seen_at: string | null;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: string;
  region: string;
  role: Role | null;
  created_at: string;
}

export interface WorkflowSummary {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  status: 'draft' | 'review' | 'published' | 'archived';
  environment: 'draft' | 'staging' | 'production';
  tags: string[];
  current_version_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkflowVersion {
  id: string;
  version: number;
  hash: string;
  graph?: WorkflowGraph;
}

export interface WorkflowGraph {
  schema_version: string;
  name: string;
  variables?: Record<string, unknown>;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  policies?: Record<string, unknown>;
}

export interface WorkflowNode {
  id: string;
  type: string;
  config?: Record<string, unknown>;
}

export interface WorkflowEdge {
  from: string;
  to: string;
}

export interface RunSummary {
  id: string;
  workflow_id: string;
  version_id: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'paused' | 'cancelled' | 'awaiting_approval';
  trigger: 'manual' | 'schedule' | 'webhook' | 'api';
  environment: string;
  preferred_engine: 'auto' | 'dom' | 'vision' | 'mcp';
  started_at: string | null;
  finished_at: string | null;
  duration_ms: number | null;
  cost_credits: number;
  error: string | null;
  correlation_id: string | null;
  created_at: string;
}

export interface ApprovalRequest {
  id: string;
  run_id: string | null;
  node_id: string | null;
  risk_class: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  sla_deadline: string | null;
  context: Record<string, unknown> | null;
  created_at: string;
}

export interface AuditEntry {
  id: number;
  workspace_id: string | null;
  actor_id: string | null;
  actor_type: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  meta: Record<string, unknown> | null;
  hash_chain: string;
  created_at: string;
}
