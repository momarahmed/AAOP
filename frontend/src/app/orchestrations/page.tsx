'use client';

import { useEffect, useState } from 'react';
import { Box, Button, Chip, IconButton, TextField, Typography, Tab, Tabs, Tooltip, Alert } from '@mui/material';
import { AppShell } from '@/components/shared/AppShell';
import { FusionCard } from '@/components/shared/Card';
import { StatusPill } from '@/components/shared/StatusPill';
import { IconBolt, IconChevron, IconRefresh, IconSparkles, IconWorkflow } from '@/components/shared/Icons';
import { api, unwrapError } from '@/lib/api/client';
import type { WorkflowSummary } from '@/lib/api/types';

const SAMPLE_REQUEST = `Build a customer onboarding flow:
- Lead capture form (name, email, company, use case)
- Auto-enrich via Clearbit
- Score lead with Claude (priority high/med/low)
- If high → notify Slack #sales + create HubSpot deal
- Show success screen with next steps`;

const UI_SCHEMA = {
  schema: 'fusion-mcp/ui-v1',
  rootId: 'page_onboard',
  components: {
    page_onboard: { type: 'Page', layout: 'flex', direction: 'column', padding: 32, gap: 24, children: ['hdr_brand', 'card_form', 'card_status'] },
    hdr_brand:    { type: 'Header', title: "Welcome — let's get you onboarded" },
    card_form:    { type: 'Card', title: 'Tell us about you', children: ['form_lead'] },
    form_lead:    { type: 'Form', schema: 'lead@1', submitLabel: 'Submit & enrich', events: { onSubmit: { workflow: 'wf_lead_intake', payload: '$form.values' } }, children: ['fld_name', 'fld_email', 'fld_company', 'fld_usecase'] },
    fld_name:     { type: 'Input', name: 'name',    label: 'Full name',  required: true },
    fld_email:    { type: 'Input', name: 'email',   label: 'Work email', required: true, kind: 'email' },
    fld_company:  { type: 'Input', name: 'company', label: 'Company',    required: true },
    fld_usecase:  { type: 'Textarea', name: 'usecase', label: 'What are you trying to build?', rows: 4 },
    card_status:  { type: 'Card', title: 'Status', bind: '$state.intake', children: ['status_badge', 'status_steps'] },
    status_badge: { type: 'Badge', bindLabel: '$state.intake.priority' },
    status_steps: { type: 'Stepper', bindSteps: '$state.intake.steps' },
  },
};

const WORKFLOW = {
  schema: 'aaop/workflow-v1',
  id: 'wf_lead_intake',
  name: 'Lead intake & routing',
  trigger: { type: 'webhook', id: 'trg_form_submit', ui_event: 'form_lead.onSubmit', schema: 'lead@1' },
  nodes: [
    { id: 'n_validate', type: 'schema_validate', schema: 'lead@1', next: 'n_enrich' },
    { id: 'n_enrich',   type: 'http_request', method: 'GET', url: 'https://person.clearbit.com/v2/combined/find', credentials: 'clearbit_api_key', next: 'n_score' },
    { id: 'n_score',    type: 'agent_call', agent: 'lead-scorer-v3', model: 'claude-4-sonnet', next: 'n_branch' },
    { id: 'n_branch',   type: 'switch', on: '$score.priority', cases: { high: 'n_slack_high', med: 'n_hubspot', low: 'n_drip' } },
    { id: 'n_slack_high', type: 'slack_post',   channel: '#sales', next: 'n_callback' },
    { id: 'n_hubspot',    type: 'hubspot_create_deal', stage: 'qualified', next: 'n_callback' },
    { id: 'n_drip',       type: 'marketing_drip', campaign: 'nurture-30', next: 'n_callback' },
    { id: 'n_callback',   type: 'ui_callback', target: '$state.intake' },
  ],
};

export default function OrchestrationsPage() {
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [request, setRequest] = useState(SAMPLE_REQUEST);
  const [tab, setTab] = useState<'ui' | 'workflow' | 'bridge'>('workflow');

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<{ data: WorkflowSummary[] }>('/api/v1/workflows');
      setWorkflows(data.data ?? []);
      setError(null);
    } catch (e) {
      setError(unwrapError(e).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchWorkflows(); }, []);

  return (
    <AppShell
      breadcrumb={['Compose', 'Orchestrations', 'AI Builder']}
      title={
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 3, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <Box>
            <Box className="eyebrow eyebrow-cyan" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
              <Box className="dot dot-pulse" sx={{ color: 'var(--accent-cyan)' }} /> Agent · ui-builder-v2 · online
            </Box>
            <Typography sx={{ fontFamily: 'var(--ff-serif)', fontSize: 36, lineHeight: 1.1, color: 'var(--ink)', mt: 1 }}>
              AI UI &amp; <em>Workflow</em> Builder
            </Typography>
            <Typography sx={{ fontSize: 13, color: 'var(--ink-soft)', mt: 1, maxWidth: 720 }}>
              Describe what you want to build. The agent generates a React UI schema and a wired Agent workflow — bridged by structured payloads.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" size="small" startIcon={<IconRefresh size={13} />} onClick={fetchWorkflows}>Refresh</Button>
            <Button variant="contained" size="small" color="primary" startIcon={<IconBolt size={13} />}>New Workflow</Button>
          </Box>
        </Box>
      }
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Workflow library */}
        <FusionCard
          eyebrow={loading ? 'Loading…' : `${workflows.length} workflow${workflows.length === 1 ? '' : 's'}`}
          title="Workflow Library"
          icon={<Box sx={{ color: 'var(--accent-cyan)' }}><IconWorkflow size={14} /></Box>}
        >
          {error && <Alert severity="error" sx={{ mb: 2, fontSize: 12 }}>{error}</Alert>}
          {!loading && workflows.length === 0 && !error && (
            <Typography sx={{ fontSize: 12, color: 'var(--ink-soft)' }}>
              No workflows yet. Use the AI builder below or run <span className="mono">php artisan db:seed</span> to load the sample bank-reconciliation workflow.
            </Typography>
          )}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' }, gap: 1.5 }}>
            {workflows.map(w => (
              <Box key={w.id} sx={{
                p: 1.75, borderRadius: 1.5,
                background: 'oklch(28% 0.03 195 / 0.55)',
                border: '1px solid oklch(50% 0.04 195 / 0.3)',
                display: 'flex', flexDirection: 'column', gap: 1,
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontFamily: 'var(--ff-serif)', fontSize: 18, color: 'var(--ink)' }}>{w.name}</Typography>
                  <StatusPill tone={statusTone(w.status)} dense>{w.status}</StatusPill>
                </Box>
                {w.description && (
                  <Typography sx={{ fontSize: 12, color: 'var(--ink-muted)', minHeight: 32 }}>{w.description}</Typography>
                )}
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {w.tags.map(t => (
                    <Chip key={t} label={t} size="small" sx={{ height: 20, fontSize: 10, color: 'var(--ink-muted)' }} />
                  ))}
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                  <Box className="mono" sx={{ fontSize: 10, color: 'var(--ink-soft)' }}>
                    env · {w.environment} · updated {new Date(w.updated_at).toLocaleDateString()}
                  </Box>
                  <Tooltip title="View workflow">
                    <IconButton size="small" sx={{ color: 'var(--ink-muted)' }}>
                      <IconChevron size={14} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            ))}
          </Box>
        </FusionCard>

        {/* AI builder prompt */}
        <FusionCard
          eyebrow="User Request → Structured Spec"
          title="What should we build?"
          icon={<Box sx={{ color: 'var(--accent-cyan)' }}><IconSparkles size={14} /></Box>}
          controls={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <StatusPill tone="info" dense>schema · ui-v1 + workflow-v1</StatusPill>
              <StatusPill tone="ok"   dense>bridged</StatusPill>
            </Box>
          }
        >
          <TextField
            value={request}
            onChange={e => setRequest(e.target.value)}
            multiline rows={5} fullWidth
            sx={{ mb: 1 }}
            InputProps={{ sx: { fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--ink)' } }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
              {['+ form', '+ enrichment', '+ AI scoring', '+ Slack notify', '+ HubSpot deal'].map(c => (
                <Chip key={c} label={c} size="small" variant="outlined"
                      sx={{ height: 22, fontSize: 10, color: 'var(--ink-muted)' }} />
              ))}
            </Box>
            <Button variant="contained" color="primary" size="small" startIcon={<IconBolt size={13} />}>
              Generate UI + Workflow
            </Button>
          </Box>
        </FusionCard>

        {/* Bridged spec viewer */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1fr 1.1fr' }, gap: 1.5 }}>
          <FusionCard
            eyebrow="React Drag-and-Drop · live preview"
            title="UI Frame"
            icon={<Box sx={{ color: 'var(--accent-cyan)' }}><IconWorkflow size={14} /></Box>}
          >
            <UiPreview />
          </FusionCard>

          <FusionCard
            eyebrow="Bridge · UI ↔ Agent"
            title="Generated Spec"
            icon={<Box sx={{ color: 'var(--accent-amber)' }}><IconSparkles size={14} /></Box>}
            controls={
              <Tabs
                value={tab} onChange={(_, v) => setTab(v)}
                sx={{ minHeight: 30, '.MuiTab-root': { minHeight: 30, fontSize: 11, textTransform: 'none' } }}
              >
                <Tab value="workflow" label="Workflow" />
                <Tab value="ui"       label="UI Schema" />
                <Tab value="bridge"   label="Bridge Map" />
              </Tabs>
            }
          >
            {tab === 'workflow' && (
              <>
                <FlowGraph />
                <CodeBlock label="workflow.json" body={JSON.stringify(WORKFLOW, null, 2)} />
              </>
            )}
            {tab === 'ui' && (
              <CodeBlock label="ui-schema.json" body={JSON.stringify(UI_SCHEMA, null, 2)} />
            )}
            {tab === 'bridge' && <BridgeTable />}
          </FusionCard>
        </Box>
      </Box>
    </AppShell>
  );
}

function statusTone(s: WorkflowSummary['status']): 'info' | 'ok' | 'warn' | 'neutral' {
  switch (s) {
    case 'published': return 'ok';
    case 'review':    return 'warn';
    case 'archived':  return 'neutral';
    default:          return 'info';
  }
}

function CodeBlock({ label, body }: { label: string; body: string }) {
  return (
    <Box sx={{
      mt: 1.5,
      background: 'oklch(18% 0.02 195 / 0.85)',
      border: '1px solid oklch(50% 0.04 195 / 0.3)',
      borderRadius: 1, overflow: 'hidden',
    }}>
      <Box sx={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        px: 1.5, py: 0.75, borderBottom: '1px solid oklch(50% 0.04 195 / 0.25)',
        fontSize: 11, color: 'var(--ink-soft)',
      }}>
        <span className="mono">{label}</span>
        <Button size="small" variant="text" sx={{ minWidth: 0, fontSize: 10 }}
                onClick={() => navigator.clipboard?.writeText(body)}>
          copy
        </Button>
      </Box>
      <Box component="pre" sx={{
        m: 0, p: 1.5, fontSize: 11, fontFamily: 'var(--ff-mono)', color: 'var(--ink-muted)',
        maxHeight: 360, overflow: 'auto',
      }}>{body}</Box>
    </Box>
  );
}

function FlowGraph() {
  const nodes = [
    { type: 'webhook',         id: 'trg_form_submit', tone: 'cyan'   as const },
    { type: 'schema_validate', id: 'n_validate',      tone: 'mint'   as const },
    { type: 'http_request',    id: 'n_enrich',        tone: 'amber'  as const },
    { type: 'agent_call',      id: 'n_score',         tone: 'violet' as const },
    { type: 'switch',          id: 'n_branch',        tone: 'rose'   as const },
  ];
  return (
    <Box sx={{
      p: 1.5, mt: 0.5,
      background: 'oklch(20% 0.025 195 / 0.6)',
      border: '1px solid oklch(50% 0.04 195 / 0.3)',
      borderRadius: 1, overflowX: 'auto',
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        {nodes.map((n, i) => (
          <Box key={n.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <NodePill type={n.type} id={n.id} tone={n.tone} />
            {i < nodes.length - 1 && <Box className="mono" sx={{ color: 'var(--ink-soft)' }}>→</Box>}
          </Box>
        ))}
      </Box>
      <Box sx={{ display: 'flex', gap: 1.5, mt: 1.5, flexWrap: 'wrap' }}>
        {[
          { label: 'priority = high', node: 'n_slack_high', type: 'slack_post', tone: 'amber'  as const },
          { label: 'priority = med',  node: 'n_hubspot',    type: 'hubspot',    tone: 'violet' as const },
          { label: 'priority = low',  node: 'n_drip',       type: 'drip',       tone: 'mint'   as const },
        ].map(b => (
          <Box key={b.node} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box className="mono" sx={{ fontSize: 10, color: 'var(--ink-soft)' }}>{b.label}</Box>
            <NodePill type={b.type} id={b.node} tone={b.tone} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function NodePill({ type, id, tone }: { type: string; id: string; tone: 'cyan'|'amber'|'violet'|'mint'|'rose' }) {
  return (
    <Box sx={{
      px: 1.25, py: 0.85, borderRadius: 1,
      border: '1px solid', borderColor: `var(--accent-${tone})`,
      background: `var(--accent-${tone}-soft)`,
      display: 'inline-flex', flexDirection: 'column', minWidth: 110,
    }}>
      <Box className="mono" sx={{ fontSize: 11, color: `var(--accent-${tone})`, fontWeight: 600 }}>{type}</Box>
      <Box className="mono" sx={{ fontSize: 10, color: 'var(--ink-soft)' }}>{id}</Box>
    </Box>
  );
}

function BridgeTable() {
  const rows = [
    { ui: 'form_lead.onSubmit',     wf: 'trg_form_submit', schema: 'lead@1',          dir: 'ui→agent' },
    { ui: '$state.intake (write)',  wf: 'n_callback',      schema: 'intake_status@1', dir: 'agent→ui' },
    { ui: 'btn_retry.onClick',      wf: 'trg_retry',       schema: 'retry@1',         dir: 'ui→agent' },
  ];
  return (
    <Box sx={{ mt: 1, overflowX: 'auto' }}>
      <Box component="table" sx={{
        width: '100%', borderCollapse: 'collapse', fontSize: 12,
        '& th': { textAlign: 'left', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-soft)', fontWeight: 600, py: 1, borderBottom: '1px solid oklch(50% 0.04 195 / 0.3)' },
        '& td': { py: 1, borderBottom: '1px solid oklch(50% 0.04 195 / 0.18)' },
      }}>
        <thead>
          <tr><th>UI Event</th><th>Workflow Hook</th><th>Schema</th><th>Direction</th></tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.ui}>
              <td className="mono">{r.ui}</td>
              <td className="mono">{r.wf}</td>
              <td className="mono">{r.schema}</td>
              <td><StatusPill tone={r.dir.startsWith('ui') ? 'info' : 'ok'} dense>{r.dir}</StatusPill></td>
            </tr>
          ))}
        </tbody>
      </Box>
    </Box>
  );
}

function UiPreview() {
  return (
    <Box sx={{
      background: 'oklch(96% 0.005 200 / 0.96)',
      borderRadius: 1.5, p: 2.5, color: 'var(--ink-dark)',
      display: 'flex', flexDirection: 'column', gap: 1.5,
      border: '1px solid oklch(75% 0.01 200)',
    }}>
      <Box>
        <Typography sx={{ fontFamily: 'var(--ff-serif)', fontSize: 22, color: 'var(--ink-dark)' }}>
          Welcome — let&apos;s get you onboarded
        </Typography>
        <Typography sx={{ fontSize: 12, color: 'var(--ink-dark-muted)', mt: 0.5 }}>
          Takes about 90 seconds. We&apos;ll route you to the right team automatically.
        </Typography>
      </Box>

      <Box sx={{
        background: '#fff', borderRadius: 1.5, p: 2,
        border: '1px solid oklch(75% 0.01 200)',
      }}>
        <Typography sx={{ fontWeight: 600, fontSize: 13, color: 'var(--ink-dark)' }}>Tell us about you</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.25, mt: 1.25 }}>
          {[
            { label: 'Full name *',    val: 'Ada Lovelace',                span: 1 },
            { label: 'Work email *',   val: 'ada@analytical.io',           span: 1 },
            { label: 'Company *',      val: 'Analytical Engines Co.',      span: 1 },
            { label: 'Use case',       val: 'Internal RAG over KB · Slack triage', span: 2 },
          ].map(f => (
            <Box key={f.label} sx={{ gridColumn: `span ${f.span}` }}>
              <Typography sx={{ fontSize: 10, color: 'var(--ink-dark-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{f.label}</Typography>
              <Box sx={{
                px: 1.25, py: 0.85, mt: 0.4,
                background: 'oklch(96% 0.005 200)',
                border: '1px solid oklch(75% 0.01 200)',
                borderRadius: 1, fontSize: 12, color: 'var(--ink-dark)',
              }}>{f.val}</Box>
            </Box>
          ))}
        </Box>
        <Button variant="contained" size="small" sx={{
          mt: 1.5, background: 'oklch(45% 0.07 200)', color: '#fff', '&:hover': { background: 'oklch(50% 0.08 200)' },
        }} endIcon={<IconChevron size={12} />}>Submit &amp; enrich</Button>
      </Box>

      <Box sx={{
        background: '#fff', borderRadius: 1.5, p: 2,
        border: '1px solid oklch(75% 0.01 200)',
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ fontWeight: 600, fontSize: 13, color: 'var(--ink-dark)' }}>Status</Typography>
          <StatusPill tone="ok" dense>priority · high</StatusPill>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, mt: 1.25, alignItems: 'center', flexWrap: 'wrap' }}>
          {[
            { l: 'Validated',     s: 'done' },
            { l: 'Enriched',      s: 'done' },
            { l: 'Scored',        s: 'done' },
            { l: 'Routed',        s: 'active' },
            { l: 'Confirmation',  s: 'pending' },
          ].map((step, i, arr) => (
            <Box key={step.l} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{
                width: 16, height: 16, borderRadius: '50%',
                background: step.s === 'done' ? 'oklch(45% 0.07 200)'
                          : step.s === 'active' ? 'var(--accent-amber)'
                          : 'oklch(85% 0.005 200)',
                color: '#fff',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700,
              }}>{i + 1}</Box>
              <Typography sx={{ fontSize: 11, color: step.s === 'pending' ? 'var(--ink-dark-muted)' : 'var(--ink-dark)' }}>
                {step.l}
              </Typography>
              {i < arr.length - 1 && <Box sx={{ width: 24, height: 1, background: 'oklch(75% 0.01 200)' }} />}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
