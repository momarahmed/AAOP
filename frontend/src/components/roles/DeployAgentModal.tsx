'use client';

import { useState } from 'react';
import {
  Box, Button, Dialog, DialogContent, IconButton, MenuItem,
  Slider, Stack, TextField, Typography,
} from '@mui/material';
import {
  IconAgent, IconAlert, IconBolt, IconCheck, IconChevron, IconClose,
} from '@/components/shared/Icons';

interface Props { open: boolean; onClose: () => void; }

const MODELS = [
  { id: 'claude-4-sonnet',   cost: '$3 / 1M in',  recommended: true  },
  { id: 'gpt-4o',            cost: '$5 / 1M in',  recommended: false },
  { id: 'gemini-2-pro',      cost: '$1.2 / 1M in',recommended: false },
  { id: 'llama-3.1-405b',    cost: 'self-hosted', recommended: false },
];

const TOOLS = [
  { k: 'web-search', l: 'Web Search',   d: 'mcp/web-search · public'        },
  { k: 'vector-rag', l: 'Vector RAG',   d: 'mcp/vector-rag · internal docs' },
  { k: 'crm-read',   l: 'CRM Read',     d: 'mcp/salesforce · scoped'        },
  { k: 'code-exec',  l: 'Code Sandbox', d: 'mcp/code-exec · ephemeral'      },
  { k: 'file-write', l: 'File Write',   d: 'mcp/files · drafts only'        },
  { k: 'email-send', l: 'Email Send',   d: 'mcp/notify · approval req'      },
];

const POLICIES = [
  { k: 'strict-pii', l: 'Strict — PII + Toxicity + Off-topic', d: 'Default for customer-facing agents.' },
  { k: 'std',        l: 'Standard — PII redaction + Toxicity', d: 'Recommended for most internal use cases.' },
  { k: 'permissive', l: 'Permissive — log only',               d: 'For research / red-team agents.' },
];

export function DeployAgentModal({ open, onClose }: Props) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('atlas-research-v5');
  const [scope, setScope] = useState('atlas-prod');
  const [description, setDescription] = useState(
    'Research-oriented agent that synthesizes briefings from CRM, web and internal docs.'
  );
  const [model, setModel] = useState(MODELS[0].id);
  const [tools, setTools] = useState<string[]>(['web-search', 'vector-rag']);
  const [policy, setPolicy] = useState(POLICIES[0].k);
  const [budget, setBudget] = useState(50);

  const reset = () => { setStep(1); };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
            PaperProps={{ sx: { background: 'oklch(24% 0.03 195 / 0.96)', border: '1px solid oklch(50% 0.04 195 / 0.4)', borderRadius: 2 } }}>
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Box className="eyebrow eyebrow-cyan">Compose · Agent Definition</Box>
            <Typography sx={{ fontFamily: 'var(--ff-serif)', fontSize: 24, color: 'var(--ink)', mt: 0.5 }}>
              Deploy a new <em>agent</em>
            </Typography>
          </Box>
          <IconButton onClick={() => { onClose(); reset(); }} sx={{ color: 'var(--ink-muted)' }}>
            <IconClose size={18} />
          </IconButton>
        </Box>

        <Stepper step={step} />

        <DialogContent sx={{ p: 0, minHeight: 280 }}>
          {step === 1 && (
            <Stack spacing={2}>
              <TextField label="Agent name" size="small" required fullWidth
                         value={name} onChange={e => setName(e.target.value)}
                         InputProps={{ startAdornment: <Box sx={{ mr: 1, color: 'var(--ink-soft)' }}><IconAgent size={14} /></Box> }} />
              <TextField select label="Tenant scope" size="small" fullWidth
                         value={scope} onChange={e => setScope(e.target.value)}>
                <MenuItem value="atlas-prod">atlas-prod (current)</MenuItem>
                <MenuItem value="atlas-staging">atlas-staging</MenuItem>
                <MenuItem value="atlas-sandbox">atlas-sandbox</MenuItem>
              </TextField>
              <TextField label="Description" size="small" fullWidth multiline rows={3}
                         value={description} onChange={e => setDescription(e.target.value)} />
            </Stack>
          )}

          {step === 2 && (
            <Stack spacing={2}>
              <Box>
                <Box className="eyebrow" sx={{ mb: 1 }}>Primary model</Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
                  {MODELS.map(m => (
                    <SelectableCard key={m.id} selected={model === m.id} onClick={() => setModel(m.id)}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box className="mono" sx={{ fontSize: 12 }}>{m.id}</Box>
                        {m.recommended && (
                          <Box sx={{
                            fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                            color: 'var(--accent-mint)',
                            border: '1px solid var(--accent-mint)', px: 0.75, py: 0.1, borderRadius: 999,
                          }}>recommended</Box>
                        )}
                      </Box>
                      <Box className="mono" sx={{ fontSize: 11, color: 'var(--ink-soft)', mt: 0.5 }}>{m.cost}</Box>
                    </SelectableCard>
                  ))}
                </Box>
              </Box>

              <Box>
                <Box className="eyebrow" sx={{ mb: 1 }}>MCP tools attached</Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
                  {TOOLS.map(t => {
                    const on = tools.includes(t.k);
                    return (
                      <SelectableCard key={t.k} selected={on}
                                      onClick={() => setTools(s => s.includes(t.k) ? s.filter(x => x !== t.k) : [...s, t.k])}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{
                            width: 16, height: 16, borderRadius: 0.5,
                            border: '1px solid', borderColor: on ? 'var(--accent-cyan)' : 'oklch(50% 0.04 195 / 0.5)',
                            background: on ? 'var(--accent-cyan)' : 'transparent',
                            color: 'var(--ink-dark)',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          }}>{on && <IconCheck size={11} />}</Box>
                          <Typography sx={{ fontSize: 12, color: 'var(--ink)' }}>{t.l}</Typography>
                        </Box>
                        <Box className="mono" sx={{ fontSize: 10, color: 'var(--ink-soft)', mt: 0.5 }}>{t.d}</Box>
                      </SelectableCard>
                    );
                  })}
                </Box>
              </Box>
            </Stack>
          )}

          {step === 3 && (
            <Stack spacing={2}>
              <Box>
                <Box className="eyebrow" sx={{ mb: 1 }}>Guardrail policy</Box>
                <Stack spacing={1}>
                  {POLICIES.map(p => (
                    <SelectableCard key={p.k} selected={policy === p.k} onClick={() => setPolicy(p.k)}>
                      <Box sx={{ fontSize: 13, color: 'var(--ink)' }}>{p.l}</Box>
                      <Box sx={{ fontSize: 11, color: 'var(--ink-soft)' }}>{p.d}</Box>
                    </SelectableCard>
                  ))}
                </Stack>
              </Box>

              <Box>
                <Box className="eyebrow" sx={{ mb: 1 }}>Daily token budget · ${budget}.00</Box>
                <Slider value={budget} onChange={(_, v) => setBudget(v as number)}
                        min={0} max={200} step={5} valueLabelDisplay="auto" />
                <Typography sx={{ fontSize: 11, color: 'var(--ink-soft)' }}>Hard cap. Auto-pauses agent when reached.</Typography>
              </Box>
            </Stack>
          )}

          {step === 4 && (
            <Stack spacing={1.25}>
              <ReviewRow l="Name"   v={name} />
              <ReviewRow l="Scope"  v={scope} />
              <ReviewRow l="Model"  v={model} />
              <ReviewRow l="Tools"  v={tools.join(', ') || '—'} />
              <ReviewRow l="Policy" v={policy} />
              <ReviewRow l="Budget" v={`$${budget}/day`} />
              <Box sx={{
                mt: 1, p: 1.5, borderRadius: 1,
                background: 'oklch(78% 0.13 70 / 0.12)',
                border: '1px solid oklch(78% 0.13 70 / 0.4)',
                color: 'var(--accent-amber)',
                fontSize: 12, display: 'flex', gap: 1, alignItems: 'flex-start',
              }}>
                <Box sx={{ pt: 0.25 }}><IconAlert size={14} /></Box>
                <Box>Deploy will roll out as canary (5%) for 4 hours, then promote automatically if quality holds.</Box>
              </Box>
            </Stack>
          )}
        </DialogContent>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box className="eyebrow">Step {step} / 4</Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={() => { onClose(); reset(); }} variant="text">Cancel</Button>
            {step > 1 && <Button onClick={() => setStep(s => s - 1)} variant="outlined" startIcon={<IconChevron size={12} style={{ transform: 'rotate(180deg)' }} />}>Back</Button>}
            {step < 4 && <Button onClick={() => setStep(s => s + 1)} variant="contained" color="primary" endIcon={<IconChevron size={12} />}>Next</Button>}
            {step === 4 && <Button variant="contained" color="primary" startIcon={<IconBolt size={12} />} onClick={() => { onClose(); reset(); }}>Deploy as canary</Button>}
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
}

function Stepper({ step }: { step: number }) {
  const labels = ['Identity', 'Model & Tools', 'Policies', 'Review'];
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      {labels.map((l, i) => {
        const idx = i + 1;
        const active = idx === step;
        const done   = idx < step;
        return (
          <Box key={l} sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
            <Box sx={{
              width: 22, height: 22, borderRadius: '50%',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700,
              color: active ? 'var(--ink-dark)' : done ? 'var(--ink-dark)' : 'var(--ink-soft)',
              background: active ? 'var(--accent-cyan)' : done ? 'var(--accent-mint)' : 'oklch(40% 0.04 195 / 0.5)',
              border: '1px solid',
              borderColor: active ? 'var(--accent-cyan)' : done ? 'var(--accent-mint)' : 'oklch(50% 0.04 195 / 0.4)',
            }}>
              {done ? <IconCheck size={11} /> : idx}
            </Box>
            <Box sx={{ fontSize: 11, color: active ? 'var(--ink)' : 'var(--ink-soft)' }}>{l}</Box>
            {idx < labels.length && <Box sx={{ flex: 1, height: 1, background: 'oklch(50% 0.04 195 / 0.3)' }} />}
          </Box>
        );
      })}
    </Box>
  );
}

function SelectableCard({
  selected, onClick, children,
}: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <Box component="button" type="button" onClick={onClick} sx={{
      textAlign: 'left', cursor: 'pointer',
      p: 1.25, borderRadius: 1,
      background: selected ? 'oklch(40% 0.07 200 / 0.4)' : 'oklch(28% 0.03 195 / 0.55)',
      border: '1px solid',
      borderColor: selected ? 'var(--accent-cyan)' : 'oklch(50% 0.04 195 / 0.3)',
      color: 'var(--ink)',
      fontFamily: 'inherit',
      transition: 'background 120ms ease, border-color 120ms ease',
      '&:hover': { borderColor: 'var(--accent-cyan)' },
    }}>
      {children}
    </Box>
  );
}

function ReviewRow({ l, v }: { l: string; v: string }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5, borderBottom: '1px solid oklch(50% 0.04 195 / 0.2)' }}>
      <Box className="eyebrow">{l}</Box>
      <Box className="mono" sx={{ fontSize: 12, color: 'var(--ink)' }}>{v}</Box>
    </Box>
  );
}
