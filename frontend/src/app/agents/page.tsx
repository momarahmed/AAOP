'use client';

import { PlaceholderPage } from '@/components/shared/PlaceholderPage';

export default function AgentsPage() {
  return (
    <PlaceholderPage
      breadcrumb={['Compose', 'Agents']}
      eyebrow="Compose · agents"
      title={<>Agent <em>fleet</em></>}
      description="Agent definitions, models, attached MCP tools, and canary deploys are part of Phase 2 (F08 — AI Agent Planner) and the Deploy Agent flow surfaced in Roles & Users."
      phase="Phase 2-3"
      cta={{ label: 'Open Roles & Users', href: '/roles' }}
    />
  );
}
