'use client';

import { useEffect, useState } from 'react';
import { Box, Button, Typography, Alert } from '@mui/material';
import { AppShell } from '@/components/shared/AppShell';
import { FusionCard } from '@/components/shared/Card';
import { StatusPill } from '@/components/shared/StatusPill';
import { IconRefresh, IconScroll } from '@/components/shared/Icons';
import { api, browserApiUrl, unwrapError } from '@/lib/api/client';
import type { AuditEntry } from '@/lib/api/types';

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<{ data: AuditEntry[] }>('/api/v1/audit-logs');
      setEntries(data.data ?? []);
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
      breadcrumb={['Govern', 'Audit Log']}
      title={
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 3, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <Box>
            <Typography sx={{ fontFamily: 'var(--ff-serif)', fontSize: 36, lineHeight: 1.1, color: 'var(--ink)' }}>
              Tamper-evident <em>audit log</em>
            </Typography>
            <Typography sx={{ fontSize: 13, color: 'var(--ink-soft)', mt: 1, maxWidth: 720 }}>
              Hash-chained, append-only audit trail (PRD §22.2). Every privileged action is signed and verifiable end-to-end.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" size="small" startIcon={<IconRefresh size={13} />} onClick={load}>Refresh</Button>
            <Button variant="contained" color="primary" size="small" startIcon={<IconScroll size={13} />}
                    href={browserApiUrl('/api/v1/audit-logs/export')}
                    target="_blank" rel="noopener noreferrer">
              Export bundle
            </Button>
          </Box>
        </Box>
      }
    >
      <FusionCard
        eyebrow={loading ? 'Loading…' : `${entries.length} recent event${entries.length === 1 ? '' : 's'}`}
        title="Audit Trail"
        icon={<Box sx={{ color: 'var(--accent-cyan)' }}><IconScroll size={14} /></Box>}
      >
        {err && <Alert severity="error" sx={{ mb: 2, fontSize: 12 }}>{err}</Alert>}
        <Box sx={{ overflowX: 'auto' }}>
          <Box component="table" sx={{
            width: '100%', borderCollapse: 'collapse',
            '& th': { textAlign: 'left', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-soft)', fontWeight: 600, py: 1, borderBottom: '1px solid oklch(50% 0.04 195 / 0.3)' },
            '& td': { py: 1.25, borderBottom: '1px solid oklch(50% 0.04 195 / 0.18)', fontSize: 12, color: 'var(--ink)', verticalAlign: 'top' },
          }}>
            <thead>
              <tr><th>When</th><th>Actor</th><th>Action</th><th>Target</th><th>Hash</th></tr>
            </thead>
            <tbody>
              {entries.map(e => (
                <tr key={e.id}>
                  <td className="mono" style={{ color: 'var(--ink-soft)' }}>{new Date(e.created_at).toLocaleString()}</td>
                  <td>
                    <Box className="mono" sx={{ fontSize: 11 }}>
                      {e.actor_type === 'user' ? '👤' : '🛠'} {e.actor_id ?? '—'}
                    </Box>
                  </td>
                  <td>
                    <StatusPill tone="info" dense>{e.action}</StatusPill>
                  </td>
                  <td className="mono" style={{ fontSize: 11, color: 'var(--ink-muted)' }}>
                    {e.target_type ? `${e.target_type}/${e.target_id ?? '?'}` : '—'}
                  </td>
                  <td className="mono" style={{ fontSize: 10, color: 'var(--ink-soft)' }}>{e.hash_chain.slice(0, 16)}…</td>
                </tr>
              ))}
            </tbody>
          </Box>
        </Box>
      </FusionCard>
    </AppShell>
  );
}
