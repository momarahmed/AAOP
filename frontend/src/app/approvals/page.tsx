'use client';

import { useEffect, useState } from 'react';
import { Alert, Box, Button, Typography } from '@mui/material';
import { AppShell } from '@/components/shared/AppShell';
import { FusionCard } from '@/components/shared/Card';
import { StatusPill } from '@/components/shared/StatusPill';
import { IconCheck, IconClose, IconFlag, IconRefresh } from '@/components/shared/Icons';
import { api, unwrapError } from '@/lib/api/client';
import type { ApprovalRequest } from '@/lib/api/types';

export default function ApprovalsPage() {
  const [items, setItems] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<{ data: ApprovalRequest[] }>('/api/v1/approvals');
      setItems(data.data ?? []);
      setErr(null);
    } catch (e) {
      setErr(unwrapError(e).message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void load(); }, []);

  const decide = async (id: string, decision: 'approved' | 'rejected') => {
    try {
      await api.post(`/api/v1/approvals/${id}/decide`, { decision });
      await load();
    } catch (e) {
      setErr(unwrapError(e).message);
    }
  };

  return (
    <AppShell
      breadcrumb={['Govern', 'Approvals']}
      title={
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 3, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <Box>
            <Typography sx={{ fontFamily: 'var(--ff-serif)', fontSize: 36, lineHeight: 1.1, color: 'var(--ink)' }}>
              Approval <em>queue</em>
            </Typography>
            <Typography sx={{ fontSize: 13, color: 'var(--ink-soft)', mt: 1, maxWidth: 720 }}>
              Human-in-the-loop checkpoints. SLA-bounded approvals routed to designated reviewers (PRD §17.3 FR-C2 / §22.1).
            </Typography>
          </Box>
          <Button variant="outlined" size="small" startIcon={<IconRefresh size={13} />} onClick={load}>Refresh</Button>
        </Box>
      }
    >
      <FusionCard
        eyebrow={loading ? 'Loading…' : `${items.length} pending`}
        title="Pending approvals"
        icon={<Box sx={{ color: 'var(--accent-amber)' }}><IconFlag size={14} /></Box>}
      >
        {err && <Alert severity="error" sx={{ mb: 2, fontSize: 12 }}>{err}</Alert>}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {items.map(a => (
            <Box key={a.id} sx={{
              display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'auto 1fr auto auto' }, gap: 2, alignItems: 'center',
              p: 1.5, borderRadius: 1.5,
              background: 'oklch(28% 0.03 195 / 0.55)',
              border: '1px solid oklch(50% 0.04 195 / 0.3)',
            }}>
              <StatusPill tone={a.risk_class === 'critical' ? 'rose' : a.risk_class === 'high' ? 'amber' : 'info'} dense>
                {a.risk_class}
              </StatusPill>
              <Box>
                <Box sx={{ fontSize: 12, color: 'var(--ink)' }}>
                  Run <span className="mono">{a.run_id ?? '—'}</span>
                  {a.node_id && <> · node <span className="mono">{a.node_id}</span></>}
                </Box>
                <Box className="mono" sx={{ fontSize: 11, color: 'var(--ink-soft)' }}>
                  SLA · {a.sla_deadline ? new Date(a.sla_deadline).toLocaleString() : 'open'}
                </Box>
              </Box>
              <Button variant="outlined" size="small" startIcon={<IconClose size={12} />} onClick={() => decide(a.id, 'rejected')}>
                Reject
              </Button>
              <Button variant="contained" color="primary" size="small" startIcon={<IconCheck size={12} />} onClick={() => decide(a.id, 'approved')}>
                Approve
              </Button>
            </Box>
          ))}
          {!loading && items.length === 0 && (
            <Typography sx={{ fontSize: 12, color: 'var(--ink-soft)' }}>No approvals waiting on you. Nice and quiet.</Typography>
          )}
        </Box>
      </FusionCard>
    </AppShell>
  );
}
