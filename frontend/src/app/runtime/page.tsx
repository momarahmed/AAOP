'use client';

import { PlaceholderPage } from '@/components/shared/PlaceholderPage';

export default function RuntimePage() {
  return (
    <PlaceholderPage
      breadcrumb={['Admin', 'Runtime']}
      eyebrow="Worker pools · regions · capacity"
      title={<>Runtime <em>topology</em></>}
      description="Inspect worker pools, region health, queue backlogs, and CUA sandbox capacity. Lands with F12 (Observability) in Phase 4-5."
      phase="Phase 4-5"
    />
  );
}
