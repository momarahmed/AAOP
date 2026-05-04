'use client';

import { Box } from '@mui/material';

type Tone = 'ok' | 'warn' | 'err' | 'info' | 'neutral' | 'cyan' | 'amber' | 'violet' | 'mint' | 'rose';

interface Props {
  tone?: Tone;
  children: React.ReactNode;
  dense?: boolean;
}

const TONE_VAR: Record<Tone, { fg: string; bg: string }> = {
  ok:      { fg: 'var(--ok)',           bg: 'oklch(76% 0.15 155 / 0.18)' },
  warn:    { fg: 'var(--warn)',         bg: 'oklch(78% 0.14 75  / 0.18)' },
  err:     { fg: 'var(--err)',          bg: 'oklch(70% 0.18 25  / 0.18)' },
  info:    { fg: 'var(--info)',         bg: 'oklch(78% 0.14 200 / 0.18)' },
  cyan:    { fg: 'var(--accent-cyan)',  bg: 'var(--accent-cyan-soft)' },
  amber:   { fg: 'var(--accent-amber)', bg: 'var(--accent-amber-soft)' },
  violet:  { fg: 'var(--accent-violet)',bg: 'var(--accent-violet-soft)' },
  mint:    { fg: 'var(--accent-mint)',  bg: 'var(--accent-mint-soft)' },
  rose:    { fg: 'var(--accent-rose)',  bg: 'var(--accent-rose-soft)' },
  neutral: { fg: 'var(--ink-muted)',    bg: 'oklch(50% 0.04 195 / 0.18)' },
};

export function StatusPill({ tone = 'neutral', children, dense }: Props) {
  const c = TONE_VAR[tone];
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex', alignItems: 'center', gap: 0.75,
        px: dense ? 0.85 : 1.1, py: dense ? 0.2 : 0.35,
        borderRadius: 999,
        fontSize: dense ? 10 : 11, fontWeight: 600,
        letterSpacing: '0.04em', textTransform: 'uppercase',
        color: c.fg, background: c.bg,
        border: `1px solid ${c.fg}`,
        borderColor: c.fg, opacity: 0.95,
      }}
    >
      <Box sx={{ width: 5, height: 5, borderRadius: '50%', background: c.fg, boxShadow: `0 0 6px ${c.fg}` }} />
      {children}
    </Box>
  );
}
