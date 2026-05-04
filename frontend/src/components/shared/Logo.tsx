'use client';

import { Box } from '@mui/material';

interface LogoProps { size?: 'sm' | 'md' | 'lg'; }

const SIZES: Record<NonNullable<LogoProps['size']>, number> = { sm: 28, md: 36, lg: 44 };

export function Logo({ size = 'md' }: LogoProps) {
  const px = SIZES[size];
  return (
    <Box className="fmcp-logo" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.25 }}>
      <svg className="fmcp-mark-svg" width={px} height={px} viewBox="0 0 36 36" aria-hidden="true">
        <defs>
          <linearGradient id="markGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="oklch(85% 0.16 195)" />
            <stop offset="100%" stopColor="oklch(60% 0.12 200)" />
          </linearGradient>
        </defs>
        <polygon points="18,2 32,10 32,26 18,34 4,26 4,10" fill="none" stroke="url(#markGrad)" strokeWidth="1.5" />
        <circle cx="18" cy="10" r="2"  fill="oklch(85% 0.16 195)" />
        <circle cx="10" cy="22" r="2"  fill="oklch(85% 0.16 195)" />
        <circle cx="26" cy="22" r="2"  fill="oklch(85% 0.16 195)" />
        <circle cx="18" cy="18" r="2.5" fill="oklch(85% 0.16 195)" />
        <line x1="18" y1="10" x2="18" y2="18" stroke="oklch(85% 0.16 195)" strokeWidth="1" />
        <line x1="10" y1="22" x2="18" y2="18" stroke="oklch(85% 0.16 195)" strokeWidth="1" />
        <line x1="26" y1="22" x2="18" y2="18" stroke="oklch(85% 0.16 195)" strokeWidth="1" />
      </svg>
      <Box>
        <Box className="fmcp-wordmark">
          AAOP<span style={{ color: 'var(--accent-cyan)' }}>·</span><span style={{ fontStyle: 'italic' }}>Fusion</span>
        </Box>
        <Box className="fmcp-sub">Orchestration · AI Agent Platform</Box>
      </Box>
    </Box>
  );
}
