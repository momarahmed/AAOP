'use client';

import { Box, Typography } from '@mui/material';

interface FusionCardProps {
  eyebrow?: string;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  controls?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  sx?: object;
}

export function FusionCard({ eyebrow, title, subtitle, controls, icon, children, sx }: FusionCardProps) {
  return (
    <Box sx={{
      background: 'oklch(28% 0.03 195 / 0.55)',
      border: '1px solid oklch(50% 0.04 195 / 0.25)',
      borderRadius: 1.5,
      p: 2,
      display: 'flex', flexDirection: 'column',
      minWidth: 0,
      ...sx,
    }}>
      {(eyebrow || title || controls) && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5, mb: 1.5, alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {eyebrow && <Box className="eyebrow" sx={{ mb: 0.5 }}>{eyebrow}</Box>}
            {title && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'var(--ink)' }}>
                {icon}
                <Typography component="h3" sx={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
                  {title}
                </Typography>
              </Box>
            )}
            {subtitle && (
              <Typography sx={{ fontSize: 11, color: 'var(--ink-soft)', mt: 0.25 }}>{subtitle}</Typography>
            )}
          </Box>
          {controls && <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>{controls}</Box>}
        </Box>
      )}
      <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
    </Box>
  );
}
