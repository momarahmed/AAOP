'use client';

import { Box, Button, Typography } from '@mui/material';
import { AppShell } from './AppShell';
import { FusionCard } from './Card';
import { IconBolt, IconChip } from './Icons';

interface Props {
  breadcrumb: string[];
  eyebrow: string;
  title: React.ReactNode;
  description: React.ReactNode;
  phase?: string;
  cta?: { label: string; href: string };
}

export function PlaceholderPage({ breadcrumb, eyebrow, title, description, phase = 'Phase 2-4', cta }: Props) {
  return (
    <AppShell
      breadcrumb={breadcrumb}
      title={
        <Box>
          <Box className="eyebrow eyebrow-cyan" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
            <Box className="dot dot-pulse" sx={{ color: 'var(--accent-cyan)' }} /> {eyebrow}
          </Box>
          <Typography sx={{ fontFamily: 'var(--ff-serif)', fontSize: 36, lineHeight: 1.1, color: 'var(--ink)', mt: 1 }}>{title}</Typography>
        </Box>
      }
    >
      <FusionCard
        eyebrow={phase}
        title="Module roadmap"
        icon={<Box sx={{ color: 'var(--accent-cyan)' }}><IconChip size={14} /></Box>}
      >
        <Typography sx={{ fontSize: 13, color: 'var(--ink-muted)', maxWidth: 720, lineHeight: 1.7 }}>
          {description}
        </Typography>
        {cta && (
          <Box sx={{ mt: 2 }}>
            <Button variant="contained" color="primary" size="small" startIcon={<IconBolt size={13} />} href={cta.href}>
              {cta.label}
            </Button>
          </Box>
        )}
      </FusionCard>
    </AppShell>
  );
}
