'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Box, Button, Typography } from '@mui/material';
import { AppShell } from '@/components/shared/AppShell';
import { FusionCard } from '@/components/shared/Card';
import { StatusPill } from '@/components/shared/StatusPill';
import {
  IconActivity, IconAgent, IconAlert, IconBolt, IconChevron, IconDeploy,
  IconKey, IconRefresh, IconScroll, IconShield, IconUsers, IconWorkflow,
} from '@/components/shared/Icons';
import { AreaChart, BarChart, DonutChart, Heatmap, RadarChart, ScatterChart, SparkBar } from '@/components/shared/Charts';
import { useAuth } from '@/lib/auth/AuthContext';

const seq = (n: number, base: number, vol: number) =>
  Array.from({ length: n }, (_, i) => Math.max(0, Math.round(base + Math.sin(i * 0.4) * vol * 0.5 + (Math.random() - 0.5) * vol)));

export default function DashboardPage() {
  const { user, currentWorkspace } = useAuth();
  const [range, setRange] = useState<'1H' | '24H' | '7D' | '30D'>('24H');

  const greet = useMemo(() => {
    const h = new Date().getHours();
    if (h < 5)  return 'Working late';
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  return (
    <AppShell
      breadcrumb={['Operate', 'Overview']}
      title={
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 3, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <Box>
            <Typography sx={{ fontFamily: 'var(--ff-serif)', fontSize: 36, lineHeight: 1.1, color: 'var(--ink)' }}>
              {greet}, <em>{firstName(user?.display_name ?? user?.email ?? 'Operator')}</em>.
            </Typography>
            <Typography sx={{ fontSize: 13, color: 'var(--ink-soft)', mt: 1, maxWidth: 720 }}>
              Your fleet is healthy. <span style={{ color: 'var(--accent-cyan)' }}>187</span> agents online across 38 regions,{' '}
              <span style={{ color: 'var(--accent-amber)' }}>3</span> open incidents, and an active orchestration backlog of 42.
              Workspace: <span className="mono">{currentWorkspace?.name ?? '—'}</span>.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Box sx={{
              display: 'inline-flex',
              background: 'oklch(28% 0.03 195 / 0.6)',
              border: '1px solid oklch(50% 0.04 195 / 0.3)',
              borderRadius: 1, p: 0.25,
            }}>
              {(['1H','24H','7D','30D'] as const).map(r => (
                <Box key={r} component="button" onClick={() => setRange(r)} sx={{
                  px: 1.25, py: 0.5, fontSize: 11, fontWeight: 600, letterSpacing: '0.05em',
                  color: range === r ? 'var(--ink)' : 'var(--ink-soft)',
                  background: range === r ? 'oklch(40% 0.05 200 / 0.6)' : 'transparent',
                  border: 'none', borderRadius: 0.75, cursor: 'pointer',
                  fontFamily: 'inherit',
                }}>{r}</Box>
              ))}
            </Box>
            <Button variant="outlined" size="small" startIcon={<IconRefresh size={13} />}>Refresh</Button>
            <Button variant="outlined" size="small" startIcon={<IconScroll size={13} />}>Export</Button>
            <Button variant="contained" size="small" color="primary" startIcon={<IconDeploy size={13} />}>Deploy Agent</Button>
          </Box>
        </Box>
      }
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <KpiStrip />

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.4fr 1fr 1fr' }, gap: 1.5 }}>
          <FusionCard
            eyebrow={`Real-time · ${range}`}
            title="Orchestration Run Volume"
            subtitle="Agent invocations stratified by execution layer"
            icon={<Box sx={{ color: 'var(--accent-cyan)' }}><IconActivity size={14} /></Box>}
            controls={<Legend items={[{ l: 'Agent runs', c: 'var(--accent-cyan)' }, { l: 'Tool calls', c: 'var(--accent-amber)' }, { l: 'RAG', c: 'var(--accent-violet)' }]} />}
          >
            <AreaChart data={seq(24, 90, 30).map((v, i) => ({ label: `${i}h`, value: v }))} height={220} />
          </FusionCard>

          <FusionCard
            eyebrow="Live"
            title="Plane Reliability"
            subtitle="SLO · this hour"
            icon={<Box sx={{ color: 'var(--accent-mint)' }}><IconShield size={14} /></Box>}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
              <DonutChart value={99} sublabel="availability" color="var(--accent-mint)" />
              <DonutChart value={87} sublabel="success rate" color="var(--accent-cyan)" />
              <DonutChart value={72} sublabel="error budget" color="var(--accent-amber)" size={100} />
            </Box>
          </FusionCard>

          <FusionCard
            eyebrow="Eval · v4"
            title="Agent Capability Radar"
            icon={<Box sx={{ color: 'var(--accent-cyan)' }}><IconAgent size={14} /></Box>}
          >
            <Box sx={{ aspectRatio: '1 / 1', mt: 1 }}>
              <RadarChart axes={['Reasoning','Tool Use','Latency','Faithfulness','Cost','Recovery','Safety','Determinism']}
                          values={[88, 92, 76, 84, 70, 80, 95, 78]} />
            </Box>
          </FusionCard>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.4fr 1fr' }, gap: 1.5 }}>
          <FusionCard
            eyebrow="P95 ms · 24h"
            title="Region × Hour Latency"
            icon={<Box sx={{ color: 'var(--accent-violet)' }}><IconActivity size={14} /></Box>}
          >
            <Heatmap
              rows={['us-ashburn','us-phoenix','eu-frankfurt','eu-london','ap-tokyo','sa-saopaulo']}
              cols={Array.from({ length: 12 }, (_, i) => `${i * 2}h`)}
              values={Array.from({ length: 6 }, () => Array.from({ length: 12 }, () => 80 + Math.random() * 220))}
            />
          </FusionCard>

          <FusionCard
            eyebrow="grouped · today"
            title="Tokens In / Out · per Model"
            icon={<Box sx={{ color: 'var(--accent-amber)' }}><IconAgent size={14} /></Box>}
            controls={<Legend items={[{ l: 'input', c: 'var(--accent-cyan)' }, { l: 'output', c: 'var(--accent-amber)' }]} />}
          >
            <BarChart
              data={[
                { label: 'gpt-4o',    value: 4200 },
                { label: 'claude-4',  value: 3800 },
                { label: 'gemini-2',  value: 2400 },
                { label: 'llama-3',   value: 1600 },
                { label: 'mistral-l', value: 1100 },
                { label: 'cohere-r',  value: 800  },
              ]}
              height={200}
            />
          </FusionCard>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1.2fr' }, gap: 1.5 }}>
          <FusionCard
            eyebrow="Per-agent · last 7d"
            title="Cost vs Quality"
            icon={<Box sx={{ color: 'var(--accent-cyan)' }}><IconAgent size={14} /></Box>}
            subtitle="Bubble = volume"
          >
            <Box sx={{ aspectRatio: '1.4 / 1' }}>
              <ScatterChart points={[
                { x: 12, y: 88, r: 3, tone: 'cyan' },
                { x: 28, y: 92, r: 4, tone: 'cyan' },
                { x: 8,  y: 72, r: 5, tone: 'amber' },
                { x: 4,  y: 64, r: 4, tone: 'amber' },
                { x: 22, y: 84, r: 3, tone: 'violet' },
                { x: 36, y: 95, r: 2, tone: 'violet' },
                { x: 14, y: 80, r: 4, tone: 'mint' },
                { x: 18, y: 86, r: 3, tone: 'mint' },
                { x: 30, y: 78, r: 2, tone: 'rose' },
              ]} />
            </Box>
          </FusionCard>

          <FusionCard
            eyebrow="Streaming · ms"
            title="Live Latency Trace · gateway"
            icon={<Box sx={{ color: 'var(--accent-cyan)' }}><IconBolt size={14} /></Box>}
          >
            <AreaChart data={seq(60, 60, 50).map((v, i) => ({ label: i % 10 === 0 ? `${i}s` : '', value: v }))} height={150} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, fontSize: 11, color: 'var(--ink-soft)' }}>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                <Box className="dot dot-pulse" sx={{ color: 'var(--accent-cyan)' }} />
                <span className="mono">streaming · 5s window</span>
              </Box>
              <Box className="mono">p50 78ms · p95 182ms · p99 412ms</Box>
            </Box>
          </FusionCard>

          <FusionCard
            eyebrow="Live · Sev 1-4"
            title="Incident & Event Stream"
            icon={<Box sx={{ color: 'var(--accent-rose)' }}><IconAlert size={14} /></Box>}
          >
            <EventStream />
          </FusionCard>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.4fr 1fr 1fr' }, gap: 1.5 }}>
          <FusionCard
            eyebrow="42 running · 1,284 queued"
            title="Active Orchestrations"
            icon={<Box sx={{ color: 'var(--accent-cyan)' }}><IconWorkflow size={14} /></Box>}
            controls={
              <Button size="small" variant="text" component={Link} href="/orchestrations" endIcon={<IconChevron size={12} />}>
                View all
              </Button>
            }
          >
            <ActiveOrchestrations />
          </FusionCard>

          <FusionCard
            eyebrow="last 24h · 37 hits"
            title="Guardrail Composition"
            icon={<Box sx={{ color: 'var(--accent-amber)' }}><IconShield size={14} /></Box>}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <DonutChart value={68} label="37" sublabel="hits" color="var(--accent-amber)" />
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.75, fontSize: 12 }}>
                {[
                  { l: 'PII redaction',   c: 'var(--accent-amber)',  v: '14' },
                  { l: 'Toxicity',        c: 'var(--accent-rose)',   v: '8'  },
                  { l: 'Off-topic',       c: 'var(--accent-violet)', v: '7'  },
                  { l: 'Tool perms',      c: 'var(--accent-cyan)',   v: '5'  },
                  { l: 'Cost cap',        c: 'var(--accent-mint)',   v: '3'  },
                ].map(d => (
                  <Box key={d.l} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 9, height: 9, borderRadius: 0.5, background: d.c }} />
                    <Box sx={{ flex: 1, color: 'var(--ink-muted)' }}>{d.l}</Box>
                    <Box className="mono" sx={{ color: 'var(--ink)' }}>{d.v}</Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </FusionCard>

          <FusionCard
            eyebrow="shortcuts"
            title="Quick Actions"
            icon={<Box sx={{ color: 'var(--accent-cyan)' }}><IconBolt size={14} /></Box>}
          >
            <QuickActions />
          </FusionCard>
        </Box>

        <Box sx={{ display: 'flex', gap: 3, py: 2, borderTop: '1px solid oklch(50% 0.04 195 / 0.2)', flexWrap: 'wrap' }}>
          <FootLink href="/orchestrations" icon={<IconWorkflow size={14} />}>View Orchestrations</FootLink>
          <FootLink href="/roles" icon={<IconUsers size={14} />}>Roles &amp; Users</FootLink>
          <FootLink href="/audit" icon={<IconScroll size={14} />}>Audit log</FootLink>
        </Box>
      </Box>
    </AppShell>
  );
}

function firstName(s: string): string {
  const head = s.split(/\s+|@/)[0];
  return head.charAt(0).toUpperCase() + head.slice(1);
}

function Legend({ items }: { items: { l: string; c: string }[] }) {
  return (
    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
      {items.map(it => (
        <Box key={it.l} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, fontSize: 11, color: 'var(--ink-muted)' }}>
          <Box sx={{ width: 9, height: 9, borderRadius: 0.5, background: it.c }} /> {it.l}
        </Box>
      ))}
    </Box>
  );
}

function KpiStrip() {
  const items = [
    { label: 'Agent Runs · 24h',  value: '12,481', delta: '+18.2%', up: true,  spark: seq(24, 50, 30), color: 'var(--accent-cyan)'         },
    { label: 'MCP Tool Calls',    value: '4.2M',   delta: '+9.4%',  up: true,  spark: seq(24, 40, 25), color: 'var(--accent-cyan-bright)' },
    { label: 'P95 Latency',       value: '182ms',  delta: '-12ms',  up: true,  spark: seq(24, 60, 20), color: 'var(--accent-mint)'        },
    { label: 'Token Spend',       value: '$8,247', delta: '+4.1%',  up: false, spark: seq(24, 45, 25), color: 'var(--accent-amber)'       },
    { label: 'Trust Score',       value: '0.942',  delta: '+0.03',  up: true,  spark: seq(24, 55, 10), color: 'var(--accent-violet)'      },
    { label: 'Guardrail Hits',    value: '37',     delta: '+2',     up: false, spark: seq(24, 30, 30), color: 'var(--accent-rose)'        },
  ];
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', md: 'repeat(3,1fr)', xl: 'repeat(6,1fr)' }, gap: 1.5 }}>
      {items.map(k => (
        <Box key={k.label} sx={{
          background: 'oklch(28% 0.03 195 / 0.6)',
          border: '1px solid oklch(50% 0.04 195 / 0.25)',
          borderRadius: 1.5,
          p: 1.75,
          display: 'flex', flexDirection: 'column', gap: 0.75,
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box className="eyebrow">{k.label}</Box>
            <Box className="mono" sx={{ fontSize: 10, color: k.up ? 'var(--ok)' : 'var(--accent-amber)' }}>
              {k.up ? '↑' : '↓'} {k.delta}
            </Box>
          </Box>
          <Typography sx={{ fontFamily: 'var(--ff-serif)', fontSize: 28, lineHeight: 1, color: 'var(--ink)' }}>{k.value}</Typography>
          <Box sx={{ height: 32 }}><SparkBar values={k.spark} color={k.color} /></Box>
        </Box>
      ))}
    </Box>
  );
}

function EventStream() {
  const events = [
    { sev: 2, tag: 'GUARDRAIL', t: '14:41', msg: 'PII mask triggered · agent Atlas-CR-7 · redacted 3 spans', tone: 'amber'  as const },
    { sev: 4, tag: 'INFO',      t: '14:39', msg: 'Auto-scaled mcp-search-pool +6 replicas (load 84%)',      tone: 'cyan'   as const },
    { sev: 2, tag: 'POLICY',    t: '14:36', msg: 'Tool perm denied: "internal-fin/transfer" · cs-bot-12',   tone: 'amber'  as const },
    { sev: 3, tag: 'RETRY',     t: '14:32', msg: 'Run #2738 retried · upstream 503 from gemini-flash',      tone: 'violet' as const },
    { sev: 1, tag: 'CRITICAL',  t: '14:28', msg: 'Region eu-london · gateway p99 4.2s · paged on-call',     tone: 'rose'   as const },
    { sev: 4, tag: 'DEPLOY',    t: '14:21', msg: 'agent atlas-v4.2.1 promoted to canary (5%)',              tone: 'mint'   as const },
    { sev: 4, tag: 'INFO',      t: '14:14', msg: 'Vector index rebuild · 12.4M vectors · 38s',              tone: 'cyan'   as const },
  ];
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, maxHeight: 280, overflowY: 'auto', mr: -0.5, pr: 0.5 }}>
      {events.map((e, i) => (
        <Box key={i} sx={{
          display: 'grid', gridTemplateColumns: 'auto auto 1fr auto', gap: 1, alignItems: 'center',
          fontSize: 12, color: 'var(--ink-muted)',
          py: 0.6, borderBottom: '1px solid oklch(50% 0.04 195 / 0.18)',
        }}>
          <Box className="mono" sx={{
            fontSize: 10, fontWeight: 700,
            px: 0.6, borderRadius: 0.5,
            color: e.sev <= 1 ? 'var(--err)' : e.sev === 2 ? 'var(--warn)' : 'var(--ink-muted)',
            border: '1px solid currentColor',
          }}>S{e.sev}</Box>
          <StatusPill tone={e.tone} dense>{e.tag}</StatusPill>
          <Box sx={{ minWidth: 0, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {e.msg}
          </Box>
          <Box className="mono" sx={{ fontSize: 11, color: 'var(--ink-soft)' }}>{e.t}</Box>
        </Box>
      ))}
    </Box>
  );
}

function ActiveOrchestrations() {
  const rows = [
    { id: '#2741', name: 'Quarterly briefing · Banco Mila',   step: '4/5',    pct: 80,  status: 'ok'   as const },
    { id: '#2740', name: 'Vendor risk eval · NorthWind',      step: '2/8',    pct: 25,  status: 'ok'   as const },
    { id: '#2739', name: 'Customer escalation triage',        step: '7/7',    pct: 100, status: 'mint' as const },
    { id: '#2738', name: 'Code review · pr-4892',             step: '3/4',    pct: 75,  status: 'warn' as const },
    { id: '#2737', name: 'Lead enrichment · 200 records',     step: '48/200', pct: 24,  status: 'ok'   as const },
    { id: '#2736', name: 'Transcript synthesis batch',        step: '1/12',   pct: 8,   status: 'ok'   as const },
  ];
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.85 }}>
      {rows.map(r => (
        <Box key={r.id} sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: 1.25, alignItems: 'center', fontSize: 12 }}>
          <Box className="mono" sx={{ color: 'var(--ink-soft)' }}>{r.id}</Box>
          <Box sx={{ minWidth: 0, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</Box>
          <Box sx={{ width: 100, height: 5, borderRadius: 999, background: 'oklch(40% 0.04 195 / 0.4)' }}>
            <Box sx={{
              width: `${r.pct}%`, height: '100%', borderRadius: 999,
              background: r.status === 'warn' ? 'var(--warn)' : r.status === 'mint' ? 'var(--ok)' : 'var(--accent-cyan)',
              boxShadow: '0 0 8px currentColor',
            }} />
          </Box>
          <StatusPill tone={r.status === 'warn' ? 'warn' : r.status === 'mint' ? 'ok' : 'info'} dense>{r.step}</StatusPill>
        </Box>
      ))}
    </Box>
  );
}

function QuickActions() {
  const items = [
    { i: <IconAgent     size={18} />, l: 'Deploy Agent',      href: '/agents'         },
    { i: <IconWorkflow  size={18} />, l: 'New Orchestration', href: '/orchestrations' },
    { i: <IconBolt      size={18} />, l: 'Connect MCP',       href: '/tools'          },
    { i: <IconShield    size={18} />, l: 'New Policy',        href: '/policies'       },
    { i: <IconKey       size={18} />, l: 'Mint API Key',      href: '/secrets'        },
    { i: <IconUsers     size={18} />, l: 'Invite Member',     href: '/roles'          },
    { i: <IconScroll    size={18} />, l: 'View Audit',        href: '/audit'          },
    { i: <IconAlert     size={18} />, l: 'Open Incidents',    href: '/incidents'      },
  ];
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
      {items.map(qa => (
        <Box key={qa.l} component={Link} href={qa.href} sx={{
          display: 'flex', flexDirection: 'column', gap: 0.5,
          alignItems: 'flex-start', justifyContent: 'flex-start',
          textDecoration: 'none', color: 'var(--ink-muted)',
          px: 1.25, py: 1.25,
          background: 'oklch(28% 0.03 195 / 0.55)',
          border: '1px solid oklch(50% 0.04 195 / 0.3)',
          borderRadius: 1,
          fontSize: 11, fontWeight: 500,
          transition: 'background 120ms ease, color 120ms ease',
          '&:hover': { color: 'var(--ink)', background: 'oklch(35% 0.04 200 / 0.6)' },
        }}>
          <Box sx={{ color: 'var(--accent-cyan)' }}>{qa.i}</Box>
          {qa.l}
        </Box>
      ))}
    </Box>
  );
}

function FootLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Box component={Link} href={href} sx={{
      display: 'inline-flex', alignItems: 'center', gap: 0.75,
      color: 'var(--ink-muted)', fontSize: 12, textDecoration: 'none',
      '&:hover': { color: 'var(--ink)' },
    }}>{icon} {children}</Box>
  );
}
