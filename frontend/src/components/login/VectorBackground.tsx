'use client';

import { useEffect, useRef } from 'react';
import { Box } from '@mui/material';

interface Props { particleCount?: number; }

export function VectorBackground({ particleCount = 36 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width  = canvas.offsetWidth  * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const W = () => canvas.offsetWidth;
    const H = () => canvas.offsetHeight;
    const nodes = Array.from({ length: particleCount }, () => ({
      x: Math.random() * W(),
      y: Math.random() * H(),
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      r: 1 + Math.random() * 1.8,
      pulse: Math.random() * Math.PI * 2,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, W(), H());
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy; n.pulse += 0.02;
        if (n.x < 0 || n.x > W()) n.vx *= -1;
        if (n.y < 0 || n.y > H()) n.vy *= -1;
      });
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 180) {
            const alpha = (1 - d / 180) * 0.25;
            ctx.strokeStyle = `oklch(78% 0.14 200 / ${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      nodes.forEach(n => {
        const glow = 1 + Math.sin(n.pulse) * 0.3;
        ctx.fillStyle = 'oklch(85% 0.16 195 / 0.7)';
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * glow, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'oklch(85% 0.16 195 / 0.15)';
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * glow * 4, 0, Math.PI * 2);
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [particleCount]);

  return (
    <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <Box
        component="svg"
        viewBox="0 0 1600 1000"
        preserveAspectRatio="xMidYMid slice"
        sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.95 }}
      >
        <defs>
          <radialGradient id="bgGlow" cx="50%" cy="50%">
            <stop offset="0%"   stopColor="oklch(50% 0.08 195)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="oklch(28% 0.04 195)" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="oklch(85% 0.16 195)" stopOpacity="0" />
            <stop offset="50%"  stopColor="oklch(85% 0.16 195)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="oklch(85% 0.16 195)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <ellipse cx="200"  cy="200" rx="500" ry="320" fill="url(#bgGlow)" />
        <ellipse cx="1400" cy="800" rx="600" ry="400" fill="url(#bgGlow)" />
        <path d="M 100 500 C 100 300, 300 200, 500 250 S 800 400, 750 600 S 500 800, 300 750 S 100 700, 100 500 Z"
              fill="oklch(40% 0.05 195 / 0.18)" stroke="oklch(70% 0.1 195 / 0.15)" strokeWidth="1" />
        <path d="M 1100 100 C 1300 80, 1500 200, 1480 400 S 1300 600, 1100 550 S 950 350, 1000 200 Z"
              fill="oklch(38% 0.06 200 / 0.2)" stroke="oklch(70% 0.1 200 / 0.18)" strokeWidth="1" />
        <g transform="translate(800 500)" opacity="0.4">
          <circle r="180" fill="none" stroke="oklch(78% 0.14 200)" strokeWidth="0.5" strokeDasharray="2 6" />
          <circle r="280" fill="none" stroke="oklch(78% 0.14 200)" strokeWidth="0.5" strokeDasharray="4 12" />
          <circle r="400" fill="none" stroke="oklch(78% 0.14 200)" strokeWidth="0.4" strokeDasharray="1 8" />
          <circle r="540" fill="none" stroke="oklch(78% 0.14 200)" strokeWidth="0.3" strokeDasharray="2 16" />
        </g>
        <path d="M -50 700 Q 400 600, 800 700 T 1650 650" fill="none" stroke="url(#lineGrad)" strokeWidth="1.2" />
        <path d="M -50 760 Q 400 880, 800 800 T 1650 850" fill="none" stroke="url(#lineGrad)" strokeWidth="0.8" opacity="0.6" />
      </Box>
      <Box component="canvas" ref={canvasRef} sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      <Box sx={{
        position: 'absolute', inset: 0,
        backgroundImage:
          'linear-gradient(oklch(60% 0.04 195 / 0.04) 1px, transparent 1px), linear-gradient(90deg, oklch(60% 0.04 195 / 0.04) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
        maskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,0.7), rgba(0,0,0,0))',
      }} />
      <Box sx={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 50%, oklch(20% 0.03 195 / 0.85) 100%)',
      }} />
    </Box>
  );
}
