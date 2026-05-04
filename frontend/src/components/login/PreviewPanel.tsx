'use client';

import { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { StatusPill } from '@/components/shared/StatusPill';
import { IconActivity, IconWorkflow, IconSparkles } from '@/components/shared/Icons';

export function PreviewPanel() {
  const [run, setRun] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setRun(r => (r + 1) % 100), 80);
    return () => clearInterval(t);
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box>
        <Box className="eyebrow eyebrow-amber" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
          <Box className="dot dot-pulse" sx={{ color: 'var(--accent-amber)' }} />
          Preview Mode · Live Telemetry
        </Box>
        <Typography sx={{
          fontFamily: 'var(--ff-serif)',
          fontSize: 24, lineHeight: 1.15, mt: 0.75, color: 'var(--ink)',
        }}>
          A glimpse of what&apos;s<br />running inside.
        </Typography>
      </Box>

      <PreviewCard
        title={<Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}><IconWorkflow size={14} /><span className="mono">orchestration · run #2741</span></Box>}
        right={<StatusPill tone="info" dense>active</StatusPill>}
      >
        <Box component="svg" viewBox="0 0 320 110" sx={{ width: '100%', height: 110 }}>
          <defs>
            <linearGradient id="loginEdge" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor="oklch(78% 0.14 200)" stopOpacity="0.2" />
              <stop offset="100%" stopColor="oklch(78% 0.14 200)" stopOpacity="0.7" />
            </linearGradient>
          </defs>
          <path d="M 30 55 C 80 55, 80 25, 130 25" stroke="url(#loginEdge)" strokeWidth="1.4" fill="none" />
          <path d="M 30 55 C 80 55, 80 85, 130 85" stroke="url(#loginEdge)" strokeWidth="1.4" fill="none" />
          <path d="M 130 25 C 180 25, 180 55, 230 55" stroke="url(#loginEdge)" strokeWidth="1.4" fill="none" />
          <path d="M 130 85 C 180 85, 180 55, 230 55" stroke="url(#loginEdge)" strokeWidth="1.4" fill="none" />
          <path d="M 230 55 C 270 55, 270 55, 290 55" stroke="oklch(78% 0.14 200)" strokeWidth="1.6" fill="none" strokeDasharray="3 3">
            <animate attributeName="stroke-dashoffset" from="0" to="-12" dur="1.5s" repeatCount="indefinite" />
          </path>
          <circle r="3" fill="oklch(85% 0.18 195)">
            <animateMotion dur="2.5s" repeatCount="indefinite" path="M 30 55 C 80 55, 80 25, 130 25" />
          </circle>
          {[
            { x: 30,  y: 55, l: 'plan',   c: 'cy' },
            { x: 130, y: 25, l: 'tools',  c: 'cy' },
            { x: 130, y: 85, l: 'rag',    c: 'cy' },
            { x: 230, y: 55, l: 'verify', c: 'amb' },
            { x: 290, y: 55, l: '·',      c: 'cy', dim: true },
          ].map((n, i) => (
            <g key={i} transform={`translate(${n.x} ${n.y})`}>
              <circle r="11" fill={n.c === 'amb' ? 'oklch(78% 0.13 70 / 0.15)' : 'oklch(78% 0.14 200 / 0.15)'}
                              stroke={n.c === 'amb' ? 'oklch(78% 0.13 70)'      : 'oklch(78% 0.14 200)'} strokeWidth="1" />
              <circle r="3"  fill={n.c === 'amb' ? 'oklch(78% 0.13 70)'         : 'oklch(78% 0.14 200)'} />
              {!n.dim && <text y="26" textAnchor="middle" fill="oklch(82% 0.015 195)" fontSize="8" fontFamily="JetBrains Mono">{n.l}</text>}
            </g>
          ))}
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, pt: 1.25 }}>
          {[
            ['step',    '4 / 5'],
            ['tokens',  '48.2k'],
            ['spend',   '$0.184'],
            ['trust',   '0.94'],
          ].map(([k, v]) => (
            <Box key={k} sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
              <Box className="eyebrow">{k}</Box>
              <Box className="mono" sx={{ fontSize: 12, color: k === 'trust' ? 'var(--ok)' : 'var(--ink)' }}>{v}</Box>
            </Box>
          ))}
        </Box>
      </PreviewCard>

      <PreviewCard
        title={<Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}><IconActivity size={14} /><span className="mono">platform · 24h</span></Box>}
        right={<Box className="mono" sx={{ fontSize: 11, color: 'var(--ink-soft)' }}>{run}% sampled</Box>}
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, mb: 1 }}>
          {[
            { l: 'agent runs',     v: '12,481', d: '+18%',  up: true },
            { l: 'mcp calls',      v: '4.2M',   d: '+9%',   up: true },
            { l: 'p95 latency',    v: '182ms',  d: '-12ms', up: true },
            { l: 'guardrail hits', v: '37',     d: '+2',    up: false },
          ].map(k => (
            <Box key={k.l}>
              <Box className="eyebrow">{k.l}</Box>
              <Box className="mono" sx={{ fontSize: 14, color: 'var(--ink)' }}>{k.v}</Box>
              <Box className="mono" sx={{ fontSize: 10, color: k.up ? 'var(--ok)' : 'var(--accent-amber)' }}>{k.d}</Box>
            </Box>
          ))}
        </Box>
        <Box component="svg" viewBox="0 0 320 50" preserveAspectRatio="none" sx={{ width: '100%', height: 50 }}>
          <defs>
            <linearGradient id="loginSpark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="oklch(78% 0.14 200)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="oklch(78% 0.14 200)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M 0 30 L 20 25 L 40 28 L 60 18 L 80 22 L 100 12 L 120 16 L 140 8 L 160 14 L 180 6 L 200 10 L 220 4 L 240 8 L 260 14 L 280 6 L 300 10 L 320 4 L 320 50 L 0 50 Z"
                fill="url(#loginSpark)" />
          <path d="M 0 30 L 20 25 L 40 28 L 60 18 L 80 22 L 100 12 L 120 16 L 140 8 L 160 14 L 180 6 L 200 10 L 220 4 L 240 8 L 260 14 L 280 6 L 300 10 L 320 4"
                stroke="oklch(85% 0.16 195)" strokeWidth="1.2" fill="none" />
        </Box>
      </PreviewCard>

      <PreviewCard
        title={<Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}><IconSparkles size={14} /><span className="mono">agent fleet</span></Box>}
        right={<Box className="mono" sx={{ fontSize: 11, color: 'var(--ink-soft)' }}>187 active</Box>}
      >
        <Box sx={{
          display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: 0.5,
        }}>
          {Array.from({ length: 56 }).map((_, i) => {
            const states = ['ok','ok','ok','ok','ok','warn','ok','ok','ok','ok','idle','ok'];
            const s = states[i % states.length];
            const color = s === 'ok' ? 'var(--ok)' : s === 'warn' ? 'var(--warn)' : 'var(--ink-soft)';
            return (
              <Box key={i} sx={{
                aspectRatio: '1',
                background: color,
                opacity: s === 'idle' ? 0.25 : 0.7,
                borderRadius: 0.5,
                boxShadow: s === 'ok' ? `0 0 4px ${color}` : 'none',
              }}/>
            );
          })}
        </Box>
      </PreviewCard>
    </Box>
  );
}

function PreviewCard({ title, right, children }: { title: React.ReactNode; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Box sx={{
      background: 'oklch(28% 0.03 195 / 0.55)',
      border: '1px solid oklch(50% 0.04 195 / 0.3)',
      borderRadius: 1.5,
      p: 1.5,
      display: 'flex', flexDirection: 'column', gap: 1,
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--ink)' }}>
        {title}
        {right}
      </Box>
      {children}
    </Box>
  );
}
