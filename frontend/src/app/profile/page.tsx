'use client';

import { Box, Stack, Typography } from '@mui/material';
import { AppShell } from '@/components/shared/AppShell';
import { FusionCard } from '@/components/shared/Card';
import { StatusPill } from '@/components/shared/StatusPill';
import { IconCog, IconUsers } from '@/components/shared/Icons';
import { useAuth } from '@/lib/auth/AuthContext';

export default function ProfilePage() {
  const { user, currentWorkspace } = useAuth();
  return (
    <AppShell
      breadcrumb={['Admin', 'Profile']}
      title={
        <Box>
          <Typography sx={{ fontFamily: 'var(--ff-serif)', fontSize: 36, lineHeight: 1.1, color: 'var(--ink)' }}>
            Profile &amp; <em>preferences</em>
          </Typography>
          <Typography sx={{ fontSize: 13, color: 'var(--ink-soft)', mt: 1, maxWidth: 720 }}>
            Account details, MFA, and workspace context.
          </Typography>
        </Box>
      }
    >
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.5 }}>
        <FusionCard
          eyebrow="Account"
          title="Identity"
          icon={<Box sx={{ color: 'var(--accent-cyan)' }}><IconUsers size={14} /></Box>}
        >
          <Stack spacing={1.25}>
            <Row k="Display name" v={user?.display_name ?? '—'} />
            <Row k="Email"        v={user?.email ?? '—'} mono />
            <Row k="MFA"          v={<StatusPill tone={user?.mfa_enabled ? 'ok' : 'warn'} dense>{user?.mfa_enabled ? 'enabled' : 'not enabled'}</StatusPill>} />
            <Row k="Last seen"    v={user?.last_seen_at ? new Date(user.last_seen_at).toLocaleString() : '—'} />
          </Stack>
        </FusionCard>

        <FusionCard
          eyebrow="Workspace"
          title="Active context"
          icon={<Box sx={{ color: 'var(--accent-mint)' }}><IconCog size={14} /></Box>}
        >
          <Stack spacing={1.25}>
            <Row k="Workspace" v={currentWorkspace?.name ?? '—'} />
            <Row k="Region"    v={currentWorkspace?.region ?? '—'} mono />
            <Row k="Plan"      v={currentWorkspace?.plan ?? '—'} mono />
            <Row k="Role"      v={currentWorkspace?.role ?? '—'} />
          </Stack>
        </FusionCard>
      </Box>
    </AppShell>
  );
}

function Row({ k, v, mono }: { k: string; v: React.ReactNode; mono?: boolean }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5, borderBottom: '1px solid oklch(50% 0.04 195 / 0.18)' }}>
      <Box className="eyebrow">{k}</Box>
      <Box className={mono ? 'mono' : undefined} sx={{ fontSize: 12, color: 'var(--ink)' }}>{v}</Box>
    </Box>
  );
}
