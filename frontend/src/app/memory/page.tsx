'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Chip, MenuItem, Select, Stack, Tab, Tabs, TextField, Typography, Tooltip,
} from '@mui/material';
import { AppShell } from '@/components/shared/AppShell';
import { FusionCard } from '@/components/shared/Card';
import { StatusPill } from '@/components/shared/StatusPill';
import { IconBolt, IconRefresh, IconSparkles } from '@/components/shared/Icons';
import { api, unwrapError } from '@/lib/api/client';

type Kind = 'episodic' | 'semantic' | 'procedural' | 'preference';
interface MemoryItem {
  id: string;
  kind: Kind;
  namespace: string;
  key: string;
  content: Record<string, unknown>;
  tags: string[];
  relevance: number | null;
  expires_at: string | null;
  updated_at: string | null;
}
interface UiMapping {
  id: string;
  app_url: string;
  page_signature: string | null;
  element_label: string;
  selector: string | null;
  source: string | null;
  bbox: Record<string, unknown> | null;
  confidence: number | null;
  observed_count: number;
  last_seen_at: string | null;
  last_heal_at: string | null;
}

export default function MemoryPage() {
  const [tab, setTab] = useState<'memory' | 'mappings'>('memory');
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [mappings, setMappings] = useState<UiMapping[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Memory create form
  const [kind, setKind] = useState<Kind>('semantic');
  const [namespace, setNamespace] = useState('default');
  const [key, setKey] = useState('');
  const [content, setContent] = useState('{\n  "value": "..."\n}');
  const [tags, setTags] = useState('');

  // UI mapping form
  const [appUrl, setAppUrl] = useState('https://app.example.com/dashboard');
  const [label, setLabel] = useState('');
  const [selector, setSelector] = useState('');
  const [source, setSource] = useState<'observed' | 'heal' | 'manual' | 'seed'>('manual');

  const fetchMemory = useCallback(async () => {
    setError(null);
    try {
      const { data } = await api.get<{ data: MemoryItem[] }>('/api/v1/memory');
      setItems(data.data ?? []);
    } catch (e) {
      setError(unwrapError(e).message);
    }
  }, []);

  const fetchMappings = useCallback(async () => {
    setError(null);
    try {
      const { data } = await api.get<{ data: UiMapping[] }>('/api/v1/ui-mappings');
      setMappings(data.data ?? []);
    } catch (e) {
      setError(unwrapError(e).message);
    }
  }, []);

  useEffect(() => {
    void fetchMemory();
    void fetchMappings();
  }, [fetchMemory, fetchMappings]);

  const submitMemory = async () => {
    setBusy(true); setError(null);
    try {
      let parsed: Record<string, unknown> = {};
      try { parsed = JSON.parse(content || '{}'); } catch { throw new Error('Content must be valid JSON.'); }
      await api.post('/api/v1/memory', {
        kind, namespace, key,
        content: parsed,
        tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
      });
      setKey('');
      await fetchMemory();
    } catch (e) {
      setError(e instanceof Error ? e.message : unwrapError(e).message);
    } finally {
      setBusy(false);
    }
  };

  const submitMapping = async () => {
    setBusy(true); setError(null);
    try {
      await api.post('/api/v1/ui-mappings', {
        app_url: appUrl,
        element_label: label,
        selector,
        source,
        confidence: 0.8,
      });
      setLabel('');
      setSelector('');
      await fetchMappings();
    } catch (e) {
      setError(unwrapError(e).message);
    } finally {
      setBusy(false);
    }
  };

  const memoryByKind = useMemo(() => {
    const out: Record<Kind, number> = { episodic: 0, semantic: 0, procedural: 0, preference: 0 };
    for (const it of items) out[it.kind] = (out[it.kind] ?? 0) + 1;
    return out;
  }, [items]);

  return (
    <AppShell
      breadcrumb={['Govern', 'Memory & Mappings', 'Stores']}
      title={
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 3, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <Box>
            <Box className="eyebrow eyebrow-cyan" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
              <Box className="dot dot-pulse" sx={{ color: 'var(--accent-cyan)' }} /> memory-store · v1
            </Box>
            <Typography sx={{ fontFamily: 'var(--ff-serif)', fontSize: 36, lineHeight: 1.1, color: 'var(--ink)', mt: 1 }}>
              <em>Memory</em> &amp; UI Mapping Store
            </Typography>
            <Typography sx={{ fontSize: 13, color: 'var(--ink-soft)', mt: 1, maxWidth: 720 }}>
              Workspace-scoped memory items power the planner, while UI mappings feed the self-healing loop with stable selectors per element.
            </Typography>
          </Box>
          <Button variant="outlined" size="small" startIcon={<IconRefresh size={13} />}
                  onClick={() => { void fetchMemory(); void fetchMappings(); }}>Refresh</Button>
        </Box>
      }
    >
      {error && <Alert severity="error" sx={{ mb: 1.5, fontSize: 12 }}>{error}</Alert>}

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 1.5, borderBottom: '1px solid oklch(50% 0.04 195 / 0.3)' }}
      >
        <Tab value="memory"   label={`Memory (${items.length})`} />
        <Tab value="mappings" label={`UI mappings (${mappings.length})`} />
      </Tabs>

      {tab === 'memory' && (
        <Stack gap={2}>
          <FusionCard
            eyebrow="Upsert memory item"
            title="Workspace knowledge"
            icon={<Box sx={{ color: 'var(--accent-cyan)' }}><IconSparkles size={14} /></Box>}
            controls={<Stack direction="row" gap={0.5}>
              {(['episodic','semantic','procedural','preference'] as Kind[]).map((k) => (
                <StatusPill key={k} tone="info" dense>{k} · {memoryByKind[k]}</StatusPill>
              ))}
            </Stack>}
          >
            <Stack direction={{ xs: 'column', md: 'row' }} gap={1.25}>
              <Select size="small" value={kind} onChange={(e) => setKind(e.target.value as Kind)} sx={{ minWidth: 140 }}>
                <MenuItem value="episodic">episodic</MenuItem>
                <MenuItem value="semantic">semantic</MenuItem>
                <MenuItem value="procedural">procedural</MenuItem>
                <MenuItem value="preference">preference</MenuItem>
              </Select>
              <TextField size="small" label="namespace" value={namespace} onChange={(e) => setNamespace(e.target.value)} />
              <TextField size="small" label="key" value={key} onChange={(e) => setKey(e.target.value)} sx={{ flex: 1 }} />
              <TextField size="small" label="tags (comma)" value={tags} onChange={(e) => setTags(e.target.value)} />
              <Button variant="contained" size="small" color="primary" startIcon={<IconBolt size={13} />}
                      onClick={submitMemory} disabled={busy || !key}>Upsert</Button>
            </Stack>
            <TextField
              fullWidth multiline rows={5} sx={{ mt: 1.5 }}
              value={content} onChange={(e) => setContent(e.target.value)}
              InputProps={{ sx: { fontFamily: 'var(--ff-mono)', fontSize: 12 } }}
              label="content (JSON)"
            />
          </FusionCard>

          <FusionCard eyebrow="Stored items" title="Memory ledger" icon={<Box />}>
            {items.length === 0 ? (
              <Typography sx={{ fontSize: 12, color: 'var(--ink-soft)' }}>No memory items yet.</Typography>
            ) : (
              <Stack gap={1}>
                {items.map((it) => (
                  <Box key={it.id} sx={{
                    p: 1.25, borderRadius: 1,
                    background: 'oklch(28% 0.03 195 / 0.55)',
                    border: '1px solid oklch(50% 0.04 195 / 0.3)',
                  }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} flexWrap="wrap">
                      <Stack direction="row" gap={0.5} alignItems="center">
                        <StatusPill tone="info" dense>{it.kind}</StatusPill>
                        <Box className="mono" sx={{ fontSize: 11, color: 'var(--ink-muted)' }}>
                          {it.namespace} · {it.key}
                        </Box>
                      </Stack>
                      <Stack direction="row" gap={0.5}>
                        {(it.tags ?? []).map((t) => <Chip key={t} label={t} size="small" sx={{ height: 20, fontSize: 10 }} />)}
                      </Stack>
                    </Stack>
                    <Box component="pre" sx={{
                      m: 0, mt: 1, p: 1, fontSize: 11, fontFamily: 'var(--ff-mono)', color: 'var(--ink-muted)',
                      background: 'oklch(20% 0.025 195 / 0.5)', borderRadius: 0.75, overflow: 'auto',
                    }}>{JSON.stringify(it.content, null, 2)}</Box>
                  </Box>
                ))}
              </Stack>
            )}
          </FusionCard>
        </Stack>
      )}

      {tab === 'mappings' && (
        <Stack gap={2}>
          <FusionCard
            eyebrow="Upsert UI mapping"
            title="Self-healing memory"
            icon={<Box sx={{ color: 'var(--accent-amber)' }}><IconSparkles size={14} /></Box>}
          >
            <Stack direction={{ xs: 'column', md: 'row' }} gap={1.25}>
              <TextField size="small" label="app_url" value={appUrl} onChange={(e) => setAppUrl(e.target.value)} sx={{ minWidth: 260 }} />
              <TextField size="small" label="element_label" value={label} onChange={(e) => setLabel(e.target.value)} sx={{ flex: 1 }} />
              <TextField size="small" label="selector" value={selector} onChange={(e) => setSelector(e.target.value)} sx={{ flex: 1 }} />
              <Select size="small" value={source} onChange={(e) => setSource(e.target.value as 'observed' | 'heal' | 'manual' | 'seed')} sx={{ minWidth: 120 }}>
                <MenuItem value="manual">manual</MenuItem>
                <MenuItem value="observed">observed</MenuItem>
                <MenuItem value="heal">heal</MenuItem>
                <MenuItem value="seed">seed</MenuItem>
              </Select>
              <Button variant="contained" size="small" color="primary" startIcon={<IconBolt size={13} />}
                      onClick={submitMapping} disabled={busy || !label}>Upsert</Button>
            </Stack>
          </FusionCard>

          <FusionCard eyebrow={`${mappings.length} mappings`} title="Heal-able selectors" icon={<Box />}>
            {mappings.length === 0 ? (
              <Typography sx={{ fontSize: 12, color: 'var(--ink-soft)' }}>No UI mappings yet.</Typography>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' }, gap: 1 }}>
                {mappings.map((m) => (
                  <Box key={m.id} sx={{
                    p: 1.25, borderRadius: 1,
                    background: 'oklch(28% 0.03 195 / 0.55)',
                    border: '1px solid oklch(50% 0.04 195 / 0.3)',
                  }}>
                    <Stack direction="row" alignItems="center" gap={0.75} flexWrap="wrap">
                      <Tooltip title={m.app_url}><Box className="mono" sx={{ fontSize: 11, color: 'var(--ink-muted)', maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.app_url}</Box></Tooltip>
                      <StatusPill tone="info" dense>{m.source ?? 'observed'}</StatusPill>
                      <StatusPill tone="ok"   dense>obs · {m.observed_count}</StatusPill>
                      {m.confidence != null && <StatusPill tone="warn" dense>conf · {m.confidence.toFixed(2)}</StatusPill>}
                    </Stack>
                    <Typography sx={{ fontFamily: 'var(--ff-serif)', fontSize: 16, color: 'var(--ink)', mt: 0.5 }}>{m.element_label}</Typography>
                    {m.selector && (
                      <Box className="mono" sx={{ fontSize: 11, color: 'var(--ink-soft)', mt: 0.5, wordBreak: 'break-all' }}>{m.selector}</Box>
                    )}
                  </Box>
                ))}
              </Box>
            )}
          </FusionCard>
        </Stack>
      )}
    </AppShell>
  );
}
