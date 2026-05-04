'use client';

/**
 * Chart primitives for the AAOP dashboard, hand-rolled in SVG to keep the
 * bundle small and to match the "Fusion MCP" visual language exactly.
 *
 * Each chart is server-renderable, uses CSS variables from globals.css for
 * theming and accepts plain JSON shaped data so backend feeds can drop in
 * directly.
 */

import { Fragment, useMemo } from 'react';
import { Box, Typography } from '@mui/material';

const CYAN   = 'var(--accent-cyan)';
const CYAN_S = 'var(--accent-cyan-soft)';
const AMBER  = 'var(--accent-amber)';
const VIOLET = 'var(--accent-violet)';
const MINT   = 'var(--accent-mint)';
const ROSE   = 'var(--accent-rose)';
const LINE   = 'oklch(55% 0.04 195 / 0.4)';

export interface AreaChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
}

export function AreaChart({ data, height = 140, color = CYAN }: AreaChartProps) {
  const { path, area, max, min } = useMemo(() => buildArea(data), [data]);
  return (
    <Box sx={{ width: '100%', height }}>
      <svg width="100%" height="100%" viewBox={`0 0 100 100`} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="areaG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity="0.45" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#areaG)" />
        <path d={path} fill="none" stroke={color} strokeWidth={1.4} />
      </svg>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.75 }}>
        <Typography sx={{ fontSize: 10, color: 'var(--ink-soft)' }}>{data[0]?.label}</Typography>
        <Typography sx={{ fontSize: 10, color: 'var(--ink-soft)' }}>min {min} · max {max}</Typography>
        <Typography sx={{ fontSize: 10, color: 'var(--ink-soft)' }}>{data.at(-1)?.label}</Typography>
      </Box>
    </Box>
  );
}

export function BarChart({ data, height = 140, color = AMBER }: AreaChartProps) {
  const max = Math.max(1, ...data.map(d => d.value));
  return (
    <Box sx={{ width: '100%', height }}>
      <svg width="100%" height="100%" viewBox={`0 0 100 100`} preserveAspectRatio="none">
        {data.map((d, i) => {
          const w = 100 / data.length;
          const h = (d.value / max) * 95;
          return (
            <rect key={d.label} x={i * w + w * 0.18} y={100 - h} width={w * 0.64} height={h}
                  fill={color} opacity={0.85} />
          );
        })}
      </svg>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.75 }}>
        {data.map(d => (
          <Typography key={d.label} sx={{ fontSize: 10, color: 'var(--ink-soft)' }}>{d.label}</Typography>
        ))}
      </Box>
    </Box>
  );
}

interface DonutProps { value: number; label?: string; sublabel?: string; size?: number; color?: string; }

export function DonutChart({ value, label, sublabel, size = 120, color = CYAN }: DonutProps) {
  const r = 38, c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <Box sx={{ width: size, height: size, position: 'relative' }}>
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <circle cx="50" cy="50" r={r} stroke={LINE} strokeWidth="6" fill="none" />
        <circle cx="50" cy="50" r={r} stroke={color} strokeWidth="6" fill="none"
                strokeDasharray={c} strokeDashoffset={c - (v / 100) * c}
                strokeLinecap="round" transform="rotate(-90 50 50)" />
      </svg>
      <Box sx={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Typography sx={{ fontFamily: 'var(--ff-serif)', fontSize: 22, color: 'var(--ink)' }}>
          {label ?? `${v}%`}
        </Typography>
        {sublabel && (
          <Typography sx={{ fontSize: 10, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {sublabel}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

interface SparkProps { values: number[]; color?: string; height?: number; }

export function SparkBar({ values, color = MINT, height = 32 }: SparkProps) {
  const max = Math.max(1, ...values);
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${values.length * 4} 32`} preserveAspectRatio="none">
      {values.map((v, i) => {
        const h = (v / max) * 28 + 2;
        return <rect key={i} x={i * 4 + 0.5} y={32 - h} width={3} height={h} fill={color} opacity={0.85} />;
      })}
    </svg>
  );
}

interface RadarProps { axes: string[]; values: number[]; max?: number; }

export function RadarChart({ axes, values, max = 100 }: RadarProps) {
  const cx = 50, cy = 50, r = 40;
  const points = axes.map((_, i) => {
    const a = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
    const v = Math.min(max, values[i] ?? 0) / max;
    return [cx + Math.cos(a) * r * v, cy + Math.sin(a) * r * v];
  });
  const ring = (k: number) => axes.map((_, i) => {
    const a = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
    return `${cx + Math.cos(a) * r * k},${cy + Math.sin(a) * r * k}`;
  }).join(' ');
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      {[0.25, 0.5, 0.75, 1].map(k => (
        <polygon key={k} points={ring(k)} fill="none" stroke={LINE} strokeWidth="0.4" />
      ))}
      <polygon points={points.map(p => p.join(',')).join(' ')} fill={CYAN_S} stroke={CYAN} strokeWidth={1.2} />
      {axes.map((a, i) => {
        const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
        const x = cx + Math.cos(angle) * (r + 6);
        const y = cy + Math.sin(angle) * (r + 6);
        return (
          <text key={a} x={x} y={y} fill="var(--ink-soft)" fontSize="3.5" textAnchor="middle" dominantBaseline="central">
            {a}
          </text>
        );
      })}
    </svg>
  );
}

interface HeatmapProps { rows: string[]; cols: string[]; values: number[][]; }

export function Heatmap({ rows, cols, values }: HeatmapProps) {
  const max = Math.max(1, ...values.flat());
  return (
    <Box sx={{ display: 'grid', gap: 0.5, gridTemplateColumns: `60px repeat(${cols.length}, 1fr)` }}>
      <Box />
      {cols.map(c => (
        <Typography key={c} sx={{ fontSize: 10, color: 'var(--ink-soft)', textAlign: 'center' }}>{c}</Typography>
      ))}
      {rows.map((r, ri) => (
        <Fragment key={r}>
          <Typography sx={{ fontSize: 10, color: 'var(--ink-soft)' }}>{r}</Typography>
          {cols.map((c, ci) => {
            const v = values[ri]?.[ci] ?? 0;
            const a = v / max;
            return (
              <Box key={`${r}-${c}`} sx={{
                height: 18, borderRadius: '3px',
                background: `oklch(78% 0.14 200 / ${0.05 + a * 0.85})`,
                border: '1px solid oklch(50% 0.04 195 / 0.2)',
              }} />
            );
          })}
        </Fragment>
      ))}
    </Box>
  );
}

interface ScatterProps { points: { x: number; y: number; r?: number; tone?: 'cyan'|'amber'|'violet'|'mint'|'rose' }[]; }

export function ScatterChart({ points }: ScatterProps) {
  const xMax = Math.max(1, ...points.map(p => p.x));
  const yMax = Math.max(1, ...points.map(p => p.y));
  const colorOf = (t?: ScatterProps['points'][number]['tone']) =>
    ({ cyan: CYAN, amber: AMBER, violet: VIOLET, mint: MINT, rose: ROSE } as const)[t ?? 'cyan'];
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      <line x1="5" y1="95" x2="95" y2="95" stroke={LINE} />
      <line x1="5" y1="5"  x2="5"  y2="95" stroke={LINE} />
      {points.map((p, i) => (
        <circle key={i}
                cx={5 + (p.x / xMax) * 90}
                cy={95 - (p.y / yMax) * 90}
                r={p.r ?? 1.6}
                fill={colorOf(p.tone)} opacity={0.8} />
      ))}
    </svg>
  );
}

function buildArea(data: { label: string; value: number }[]) {
  const max = Math.max(1, ...data.map(d => d.value));
  const min = Math.min(0, ...data.map(d => d.value));
  const span = max - min || 1;
  const points = data.map((d, i) => {
    const x = (i / Math.max(1, data.length - 1)) * 100;
    const y = 100 - ((d.value - min) / span) * 95;
    return [x, y];
  });
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' ');
  const area = `${path} L100 100 L0 100 Z`;
  return { path, area, max, min };
}
