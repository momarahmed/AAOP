'use client';

import { useEffect, useState } from 'react';
import { Alert, Box, Button, Typography } from '@mui/material';
import { AppShell } from '@/components/shared/AppShell';
import { FusionCard } from '@/components/shared/Card';
import { StatusPill } from '@/components/shared/StatusPill';
import { IconKey, IconRefresh } from '@/components/shared/Icons';
import { api, unwrapError } from '@/lib/api/client';

interface SecretRef {
  id: string;
  name: string;
  rotation_policy: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export default function SecretsPage() {
  const [rows, setRows] = useState<SecretRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<{ data: SecretRef[] }>('/api/v1/secrets');
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
      breadcrumb={['Admin', 'Secrets']}
      title={
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 3, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <Box>
            <Typography sx={{ fontFamily: 'var(--ff-serif)', fontSize: 36, lineHeight: 1.1, color: 'var(--ink)' }}>
              Secret <em>references</em>
            </Typography>
            <Typography sx={{ fontSize: 13, color: 'var(--ink-soft)', mt: 1, maxWidth: 720 }}>
              AAOP only ever stores <em>references</em>. Actual values live in your KMS / Vault and are injected ephemerally at run time (PRD §22.2).
            </Typography>
          </Box>
          <Button variant="outlined" size="small" startIcon={<IconRefresh size={13} />} onClick={load}>Refresh</Button>
        </Box>
      }
    >
      <FusionCard
        eyebrow={loading ? 'Loading…' : `${rows.length} reference${rows.length === 1 ? '' : 's'}`}
        title="Vaulted references"
        icon={<Box sx={{ color: 'var(--accent-amber)' }}><IconKey size={14} /></Box>}
      >
        {err && <Alert severity="error" sx={{ mb: 2, fontSize: 12 }}>{err}</Alert>}
        <Box component="table" sx={{
          width: '100%', borderCollapse: 'collapse',
          '& th': { textAlign: 'left', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-soft)', fontWeight: 600, py: 1, borderBottom: '1px solid oklch(50% 0.04 195 / 0.3)' },
          '& td': { py: 1.25, borderBottom: '1px solid oklch(50% 0.04 195 / 0.18)', fontSize: 12, color: 'var(--ink)' },
        }}>
          <thead>
            <tr><th>Name</th><th>Rotation</th><th>Tags</th><th>Created</th></tr>
          </thead>
          <tbody>
            {rows.map(s => (
              <tr key={s.id}>
                <td>
                  <Box className="mono" sx={{ fontSize: 12 }}>{s.name}</Box>
                </td>
                <td><StatusPill tone="info" dense>{s.rotation_policy ?? 'manual'}</StatusPill></td>
                <td className="mono" style={{ fontSize: 11, color: 'var(--ink-soft)' }}>
                  {Object.entries(s.metadata ?? {}).map(([k, v]) => `${k}=${v}`).join(' · ') || '—'}
                </td>
                <td className="mono" style={{ fontSize: 11, color: 'var(--ink-soft)' }}>
                  {new Date(s.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={4} style={{ color: 'var(--ink-soft)' }}>No vaulted references yet.</td></tr>
            )}
          </tbody>
        </Box>
      </FusionCard>
    </AppShell>
  );
}
