'use client';

import { PlaceholderPage } from '@/components/shared/PlaceholderPage';

export default function RunsPage() {
  return (
    <PlaceholderPage
      breadcrumb={['Operate', 'Live Runs']}
      eyebrow="Streaming · run timeline"
      title={<>Live <em>orchestration runs</em></>}
      description={<>Per-run timeline, node deltas, retry trees, and live tokens are part of Phase 2 (F06: Workflow Engine + LangGraph checkpointer) and Phase 3 (F12: live trace UI). The data plane is already wired — this view will subscribe to <code>/api/v1/runs/{'{id}'}/stream</code> over WebSocket.</>}
      phase="Phase 2-3"
      cta={{ label: 'Open Orchestrations', href: '/orchestrations' }}
    />
  );
}
