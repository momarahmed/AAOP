'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Typography } from '@mui/material';
import { Logo } from '@/components/shared/Logo';
import { StatusTicker } from '@/components/shared/StatusTicker';
import { VectorBackground } from '@/components/login/VectorBackground';
import { LoginCard } from '@/components/login/LoginCard';
import { PreviewPanel } from '@/components/login/PreviewPanel';
import { useAuth } from '@/lib/auth/AuthContext';

export default function LoginPage() {
  const { ready, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && user) router.replace('/dashboard');
  }, [ready, user, router]);

  return (
    <Box sx={{ position: 'relative', minHeight: '100dvh', overflow: 'hidden' }}>
      <VectorBackground particleCount={36} />

      <Box sx={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center', justifyContent: 'space-between',
        px: { xs: 2, md: 5 }, pt: 3, pb: 1,
      }}>
        <Logo size="md" />
        <Box component="nav" sx={{
          display: { xs: 'none', md: 'flex' }, gap: 3,
          fontSize: 12, color: 'var(--ink-muted)',
        }}>
          {['Platform','Agents','Documentation','Status','Contact'].map(l => (
            <Box key={l} component="a" href="#"
                 sx={{ color: 'inherit', textDecoration: 'none', '&:hover': { color: 'var(--ink)' } }}>
              {l}
            </Box>
          ))}
        </Box>
        <Button variant="outlined" size="small" sx={{ textTransform: 'none' }}>Request access</Button>
      </Box>

      <Box component="main" sx={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 460px', xl: '1fr 460px 380px' },
        gap: { xs: 4, md: 5 },
        alignItems: 'start',
        maxWidth: 1700, mx: 'auto',
        px: { xs: 2, md: 5 },
        py: { xs: 4, md: 6 },
      }}>
        <HeroPanel />
        <Box sx={{ display: 'flex', justifyContent: 'center' }}><LoginCard /></Box>
        <Box sx={{ display: { xs: 'none', xl: 'block' } }}><PreviewPanel /></Box>
      </Box>

      <Box sx={{ position: 'relative', mt: 4 }}><StatusTicker /></Box>
    </Box>
  );
}

function HeroPanel() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 600 }}>
      <Box className="eyebrow eyebrow-cyan" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{
          width: 8, height: 9, background: 'linear-gradient(135deg, var(--accent-cyan-bright), oklch(60% 0.12 200))',
          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
        }} />
        AAOP · Fusion Edition · 2026.05
      </Box>
      <Typography sx={{
        fontFamily: 'var(--ff-serif)', fontWeight: 400,
        fontSize: { xs: 36, md: 56 }, lineHeight: 1.05,
        letterSpacing: '-0.02em', color: 'var(--ink)',
      }}>
        One <em style={{ color: 'var(--accent-cyan)' }}>control plane</em> for every agent, model and tool in your stack.
      </Typography>
      <Typography sx={{ fontSize: 14, color: 'var(--ink-soft)', maxWidth: 540, lineHeight: 1.6 }}>
        Compose deterministic, observable AI orchestrations across MCP servers, internal APIs and humans-in-the-loop.
        Sign in to your tenant to operate the fleet.
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, auto)', gap: 4, mt: 1 }}>
        {[
          { v: '2.4B',     l: 'orchestrated calls / month' },
          { v: '99.99%',   l: 'platform availability'      },
          { v: '38',       l: 'global regions'             },
        ].map(s => (
          <Box key={s.l}>
            <Typography sx={{ fontFamily: 'var(--ff-serif)', fontSize: 32, color: 'var(--ink)' }}>{s.v}</Typography>
            <Typography sx={{ fontSize: 11, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.18em' }}>
              {s.l}
            </Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ mt: 2 }}>
        <Box className="eyebrow" sx={{ mb: 1 }}>Trusted by enterprises in</Box>
        <Box sx={{
          display: 'flex', flexWrap: 'wrap', gap: 1.25,
          color: 'var(--ink-muted)',
        }}>
          {['BANCO·MILA','NORTHWIND','MERIDIAN','KESTREL HEALTH','POLARIS LABS','OAKVIEW FIN'].map(b => (
            <Box key={b} className="mono" sx={{
              px: 1.25, py: 0.4, borderRadius: 0.75, fontSize: 11,
              border: '1px solid oklch(50% 0.04 195 / 0.4)',
              background: 'oklch(28% 0.03 195 / 0.5)',
            }}>{b}</Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
