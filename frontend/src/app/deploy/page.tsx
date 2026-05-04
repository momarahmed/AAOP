'use client';

import { PlaceholderPage } from '@/components/shared/PlaceholderPage';

export default function DeployPage() {
  return (
    <PlaceholderPage
      breadcrumb={['Admin', 'Deployments']}
      eyebrow="Promote · canary · rollback"
      title={<>Deployment <em>pipeline</em></>}
      description="Promote workflows from draft → staging → production with canary windows and automatic rollback. Lands with F09 (Execution Orchestrator) in Phase 3."
      phase="Phase 3"
      cta={{ label: 'Open Orchestrations', href: '/orchestrations' }}
    />
  );
}
