'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Chip, MenuItem, Select, Stack, Tab, Tabs, TextField, Typography,
} from '@mui/material';
import { AppShell } from '@/components/shared/AppShell';
import { FusionCard } from '@/components/shared/Card';
import { StatusPill } from '@/components/shared/StatusPill';
import { IconBolt, IconRefresh, IconShield } from '@/components/shared/Icons';
import { api, unwrapError } from '@/lib/api/client';

type FrameworkId = 'fedramp_moderate' | 'hipaa_security' | 'soc2';

interface Control {
  id: string;
  framework: FrameworkId;
  control_id: string;
  title: string;
  description: string | null;
  default_status: string;
}

interface Attestation {
  id: string;
  control: { framework: FrameworkId | null; control_id: string | null; title: string | null };
  status: 'implemented' | 'partial' | 'not_assessed' | 'not_applicable';
  notes: string | null;
  evidence: Record<string, unknown> | null;
  attested_at: string | null;
  updated_at: string | null;
}

interface Retention {
  id: string;
  data_class: string;
  retention_days: number;
  legal_hold: boolean;
  justification: Record<string, unknown> | null;
  updated_at: string | null;
}

interface FrameworkSummary {
  framework: FrameworkId;
  controls_total: number;
  controls_attested: number;
  controls_covered: number;
  coverage_percent: number;
  by_status: Record<string, number>;
}

const FRAMEWORK_LABELS: Record<FrameworkId, string> = {
  fedramp_moderate: 'FedRAMP Moderate',
  hipaa_security:   'HIPAA Security Rule',
  soc2:             'SOC 2 (CC)',
};

export default function CompliancePage() {
  const [tab, setTab] = useState<FrameworkId | 'retention'>('fedramp_moderate');
  const [controls, setControls] = useState<Control[]>([]);
  const [attestations, setAttestations] = useState<Attestation[]>([]);
  const [summary, setSummary] = useState<FrameworkSummary[]>([]);
  const [retention, setRetention] = useState<Retention[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // attestation form
  const [selectedControl, setSelectedControl] = useState('');
  const [status, setStatus] = useState<Attestation['status']>('implemented');
  const [notes, setNotes] = useState('');

  // retention form
  const [dataClass, setDataClass] = useState('run_logs');
  const [days, setDays] = useState(365);
  const [legalHold, setLegalHold] = useState(false);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [c, a, s, r] = await Promise.all([
        api.get<{ data: Control[] }>('/api/v1/compliance/controls'),
        api.get<{ data: Attestation[] }>('/api/v1/compliance/attestations'),
        api.get<{ frameworks: FrameworkSummary[] }>('/api/v1/compliance/summary'),
        api.get<{ data: Retention[] }>('/api/v1/compliance/retention'),
      ]);
      setControls(c.data.data ?? []);
      setAttestations(a.data.data ?? []);
      setSummary(s.data.frameworks ?? []);
      setRetention(r.data.data ?? []);
    } catch (e) {
      setError(unwrapError(e).message);
    }
  }, []);

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  const submitAttestation = async () => {
    if (!selectedControl) return;
    setBusy(true); setError(null);
    try {
      await api.post('/api/v1/compliance/attestations', {
        control_id: selectedControl,
        status,
        notes,
      });
      setNotes('');
      await fetchAll();
    } catch (e) {
      setError(unwrapError(e).message);
    } finally {
      setBusy(false);
    }
  };

  const submitRetention = async () => {
    setBusy(true); setError(null);
    try {
      await api.post('/api/v1/compliance/retention', {
        data_class: dataClass,
        retention_days: days,
        legal_hold: legalHold,
      });
      await fetchAll();
    } catch (e) {
      setError(unwrapError(e).message);
    } finally {
      setBusy(false);
    }
  };

  const controlsForActive = useMemo(() => {
    if (tab === 'retention') return [];
    return controls.filter((c) => c.framework === tab);
  }, [controls, tab]);

  const attestStatusByControl = useMemo(() => {
    const m: Record<string, Attestation> = {};
    for (const a of attestations) {
      if (a.control?.control_id) m[`${a.control.framework}::${a.control.control_id}`] = a;
    }
    return m;
  }, [attestations]);

  return (
    <AppShell
      breadcrumb={['Govern', 'Compliance', 'Frameworks']}
      title={
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 3, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <Box>
            <Box className="eyebrow eyebrow-cyan" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
              <Box className="dot dot-pulse" sx={{ color: 'var(--accent-cyan)' }} /> compliance · controls · v1
            </Box>
            <Typography sx={{ fontFamily: 'var(--ff-serif)', fontSize: 36, lineHeight: 1.1, color: 'var(--ink)', mt: 1 }}>
              <em>FedRAMP</em> · HIPAA · SOC 2
            </Typography>
            <Typography sx={{ fontSize: 13, color: 'var(--ink-soft)', mt: 1, maxWidth: 720 }}>
              Track per-workspace coverage of FedRAMP Moderate, HIPAA Security Rule and SOC 2 Common Criteria. Every attestation is captured in the tamper-evident audit log.
            </Typography>
          </Box>
          <Button variant="outlined" size="small" startIcon={<IconRefresh size={13} />} onClick={fetchAll}>Refresh</Button>
        </Box>
      }
    >
      {error && <Alert severity="error" sx={{ mb: 1.5, fontSize: 12 }}>{error}</Alert>}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.25, mb: 2 }}>
        {(['fedramp_moderate','hipaa_security','soc2'] as FrameworkId[]).map((f) => {
          const s = summary.find((x) => x.framework === f);
          return (
            <FusionCard
              key={f}
              eyebrow={FRAMEWORK_LABELS[f]}
              title={s ? `${s.coverage_percent.toFixed(1)}% covered` : '— no data —'}
              icon={<Box sx={{ color: 'var(--accent-cyan)' }}><IconShield size={14} /></Box>}
            >
              <Stack direction="row" gap={0.5} flexWrap="wrap">
                <StatusPill tone="info" dense>controls · {s?.controls_total ?? 0}</StatusPill>
                <StatusPill tone="ok"   dense>covered · {s?.controls_covered ?? 0}</StatusPill>
                <StatusPill tone="warn" dense>attested · {s?.controls_attested ?? 0}</StatusPill>
              </Stack>
            </FusionCard>
          );
        })}
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{ mb: 1.5, borderBottom: '1px solid oklch(50% 0.04 195 / 0.3)' }}>
        <Tab value="fedramp_moderate" label="FedRAMP Moderate" />
        <Tab value="hipaa_security"   label="HIPAA Security" />
        <Tab value="soc2"             label="SOC 2 CC" />
        <Tab value="retention"        label="Data retention" />
      </Tabs>

      {tab !== 'retention' && (
        <Stack gap={2}>
          <FusionCard eyebrow="Attest a control" title={FRAMEWORK_LABELS[tab]} icon={<Box />}>
            <Stack direction={{ xs: 'column', md: 'row' }} gap={1.25}>
              <Select size="small" value={selectedControl} onChange={(e) => setSelectedControl(String(e.target.value))} sx={{ minWidth: 280 }} displayEmpty>
                <MenuItem value=""><em>— select control —</em></MenuItem>
                {controlsForActive.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.control_id} — {c.title}</MenuItem>
                ))}
              </Select>
              <Select size="small" value={status} onChange={(e) => setStatus(e.target.value as Attestation['status'])} sx={{ minWidth: 160 }}>
                <MenuItem value="implemented">implemented</MenuItem>
                <MenuItem value="partial">partial</MenuItem>
                <MenuItem value="not_assessed">not_assessed</MenuItem>
                <MenuItem value="not_applicable">not_applicable</MenuItem>
              </Select>
              <TextField size="small" label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} sx={{ flex: 1, minWidth: 240 }} />
              <Button variant="contained" size="small" color="primary" startIcon={<IconBolt size={13} />}
                      onClick={submitAttestation} disabled={busy || !selectedControl}>Save attestation</Button>
            </Stack>
          </FusionCard>

          <FusionCard eyebrow={`${controlsForActive.length} controls`} title={`${FRAMEWORK_LABELS[tab]} — Catalog`} icon={<Box />}>
            <Stack gap={0.75}>
              {controlsForActive.map((c) => {
                const a = attestStatusByControl[`${c.framework}::${c.control_id}`];
                const tone =
                  a?.status === 'implemented' ? 'ok' :
                  a?.status === 'partial'     ? 'warn' :
                  a?.status === 'not_applicable' ? 'neutral' : 'info';
                return (
                  <Box key={c.id} sx={{
                    p: 1.25, borderRadius: 1,
                    background: 'oklch(28% 0.03 195 / 0.55)',
                    border: '1px solid oklch(50% 0.04 195 / 0.3)',
                  }}>
                    <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap" justifyContent="space-between">
                      <Stack direction="row" alignItems="center" gap={1}>
                        <Chip label={c.control_id} size="small" sx={{ height: 22, fontFamily: 'var(--ff-mono)', fontSize: 11 }} />
                        <Typography sx={{ fontFamily: 'var(--ff-serif)', fontSize: 16, color: 'var(--ink)' }}>{c.title}</Typography>
                      </Stack>
                      <StatusPill tone={tone} dense>{a?.status ?? 'not_attested'}</StatusPill>
                    </Stack>
                    {c.description && (
                      <Typography sx={{ fontSize: 12, color: 'var(--ink-muted)', mt: 0.5 }}>{c.description}</Typography>
                    )}
                  </Box>
                );
              })}
            </Stack>
          </FusionCard>
        </Stack>
      )}

      {tab === 'retention' && (
        <Stack gap={2}>
          <FusionCard eyebrow="Set retention policy" title="Per data-class retention" icon={<Box />}>
            <Stack direction={{ xs: 'column', md: 'row' }} gap={1.25}>
              <Select size="small" value={dataClass} onChange={(e) => setDataClass(String(e.target.value))} sx={{ minWidth: 200 }}>
                <MenuItem value="run_logs">run_logs</MenuItem>
                <MenuItem value="screenshots">screenshots</MenuItem>
                <MenuItem value="audit">audit</MenuItem>
                <MenuItem value="memory">memory</MenuItem>
                <MenuItem value="exports">exports</MenuItem>
              </Select>
              <TextField size="small" type="number" label="retention_days" value={days}
                         onChange={(e) => setDays(parseInt(e.target.value || '0', 10))}
                         inputProps={{ min: 0, max: 36500 }} sx={{ width: 180 }} />
              <Stack direction="row" alignItems="center" gap={1}>
                <input type="checkbox" id="legalHold" checked={legalHold} onChange={(e) => setLegalHold(e.target.checked)} />
                <label htmlFor="legalHold" style={{ fontSize: 12, color: 'var(--ink-muted)' }}>legal_hold</label>
              </Stack>
              <Button variant="contained" size="small" color="primary" startIcon={<IconBolt size={13} />}
                      onClick={submitRetention} disabled={busy}>Save</Button>
            </Stack>
          </FusionCard>

          <FusionCard eyebrow={`${retention.length} policies`} title="Active retention" icon={<Box />}>
            {retention.length === 0 ? (
              <Typography sx={{ fontSize: 12, color: 'var(--ink-soft)' }}>No retention policies set yet.</Typography>
            ) : (
              <Stack gap={0.75}>
                {retention.map((r) => (
                  <Stack key={r.id} direction="row" gap={1} alignItems="center"
                         sx={{ p: 1, borderRadius: 1, background: 'oklch(28% 0.03 195 / 0.55)' }}>
                    <Chip label={r.data_class} size="small" sx={{ height: 22, fontFamily: 'var(--ff-mono)', fontSize: 11 }} />
                    <StatusPill tone="info" dense>{r.retention_days} days</StatusPill>
                    {r.legal_hold && <StatusPill tone="warn" dense>legal hold</StatusPill>}
                    <Box sx={{ ml: 'auto', fontSize: 11, color: 'var(--ink-soft)' }}>
                      updated {r.updated_at ? new Date(r.updated_at).toLocaleString() : '—'}
                    </Box>
                  </Stack>
                ))}
              </Stack>
            )}
          </FusionCard>
        </Stack>
      )}
    </AppShell>
  );
}
