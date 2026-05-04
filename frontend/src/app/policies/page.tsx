'use client';

import { useEffect, useState } from 'react';
import { Alert, Box, Button, Typography } from '@mui/material';
import { AppShell } from '@/components/shared/AppShell';
import { FusionCard } from '@/components/shared/Card';
import { StatusPill } from '@/components/shared/StatusPill';
import { IconRefresh, IconShield } from '@/components/shared/Icons';
import { api, unwrapError } from '@/lib/api/client';

interface PolicyRow {
  id: string;
  name: string;
  scope: 'workspace' | 'workflow' | 'environment';
  scope_id: string | null;
  enforced_at: string[];
  version: number;
  enabled: boolean;
  updated_at: string;
}

export default function PoliciesPage() {
  const [rows, setRows] = useState<PolicyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<{ data: PolicyRow[] }>('/api/v1/policies');
      setRows(data.data ?? []);
      setErr(null);
    } catch (e) {
      setErr(unwrapError(e).message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void load(); }, []);

  return (
    <AppShell
      breadcrumb={['Govern', 'Policies']}
      title={
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 3, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <Box>
            <Typography sx={{ fontFamily: 'var(--ff-serif)', fontSize: 36, lineHeight: 1.1, color: 'var(--ink)' }}>
              Policy <em>library</em>
            </Typography>
            <Typography sx={{ fontSize: 13, color: 'var(--ink-soft)', mt: 1, maxWidth: 720 }}>
              Policy-as-code (OPA / Rego) — guardrails, budget caps, approval thresholds, PII redaction. Compiled, dry-runnable, version-pinned.
            </Typography>
          </Box>
          <Button variant="outlined" size="small" startIcon={<IconRefresh size={13} />} onClick={load}>Refresh</Button>
        </Box>
      }
    >
      <FusionCard
        eyebrow={loading ? 'Loading…' : `${rows.length} policy${rows.length === 1 ? '' : 'ies'}`}
        title="Policies"
        icon={<Box sx={{ color: 'var(--accent-cyan)' }}><IconShield size={14} /></Box>}
      >
        {err && <Alert severity="error" sx={{ mb: 2, fontSize: 12 }}>{err}</Alert>}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 1.5 }}>
          {rows.map(p => (
            <Box key={p.id} sx={{
              p: 1.75, borderRadius: 1.5,
              background: 'oklch(28% 0.03 195 / 0.55)',
              border: '1px solid oklch(50% 0.04 195 / 0.3)',
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontFamily: 'var(--ff-serif)', fontSize: 18, color: 'var(--ink)' }}>{p.name}</Typography>
                <StatusPill tone={p.enabled ? 'ok' : 'neutral'} dense>{p.enabled ? 'active' : 'disabled'}</StatusPill>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, mt: 1, fontSize: 11, color: 'var(--ink-soft)', flexWrap: 'wrap' }}>
                <span className="mono">scope · {p.scope}</span> · <span className="mono">v{p.version}</span> · <span className="mono">{(p.enforced_at ?? []).join(' / ') || 'design'}</span>
              </Box>
              <Box className="mono" sx={{ fontSize: 10, color: 'var(--ink-soft)', mt: 0.75 }}>
                updated {new Date(p.updated_at).toLocaleDateString()}
              </Box>
            </Box>
          ))}
          {!loading && rows.length === 0 && (
            <Typography sx={{ fontSize: 12, color: 'var(--ink-soft)' }}>No policies yet.</Typography>
          )}
        </Box>
      </FusionCard>
    </AppShell>
  );
}
