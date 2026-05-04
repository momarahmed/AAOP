'use client';

import { Box } from '@mui/material';

const REGIONS = [
  { label: 'us-ashburn-1',  state: 'ok', latency: '12ms' },
  { label: 'eu-frankfurt-1', state: 'ok', latency: '24ms' },
  { label: 'ap-tokyo-1',     state: 'ok', latency: '38ms' },
  { label: 'agent registry', state: 'ok', latency: 'sync' },
  { label: 'mcp gateway',    state: 'ok', latency: '4ms' },
];

export function StatusTicker() {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        maxWidth: 1700,
        mx: 'auto',
        px: { xs: 2, md: 4.5 },
        py: 1.25,
        borderTop: '1px solid oklch(50% 0.04 195 / 0.2)',
        background: 'oklch(20% 0.025 195 / 0.5)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <Box className="eyebrow" sx={{ whiteSpace: 'nowrap' }}>
        Platform Status · All Systems Operational
      </Box>
      <Box sx={{ display: 'flex', gap: 3.5, flex: 1, fontSize: 11 }}>
        {REGIONS.map(r => (
          <Box key={r.label} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, color: 'var(--ink-muted)' }}>
            <Box
              sx={{
                width: 6, height: 6, borderRadius: '50%',
                background: 'var(--ok)',
                boxShadow: '0 0 6px var(--ok)',
              }}
            />
            <Box className="mono">{r.label}</Box>
            <Box className="mono" sx={{ color: 'var(--ink-soft)', ml: 0.5 }}>{r.latency}</Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
