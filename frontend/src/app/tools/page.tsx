'use client';

import { PlaceholderPage } from '@/components/shared/PlaceholderPage';

export default function ToolsPage() {
  return (
    <PlaceholderPage
      breadcrumb={['Compose', 'Tools & MCP']}
      eyebrow="Compose · tools"
      title={<>MCP servers &amp; <em>tools</em></>}
      description="Browse the MCP registry, attach tools to agents, and inspect schemas. Lands in Phase 2 (F11 — MCP Gateway + Tool Registry) once the connector pipeline is wired."
      phase="Phase 2"
    />
  );
}
