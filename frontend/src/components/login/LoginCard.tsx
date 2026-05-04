'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Button, InputAdornment, Tab, Tabs, TextField, Typography, Alert,
} from '@mui/material';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  IconChevron, IconFingerprint, IconKey, IconShield, IconUsers, IconChip,
} from '@/components/shared/Icons';

type Mode = 'credentials' | 'register' | 'sso' | 'passkey';

export function LoginCard() {
  const [mode, setMode] = useState<Mode>('credentials');
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState<string | null>(null);
  const router = useRouter();
  const { login, register } = useAuth();

  const [email,        setEmail]    = useState('admin@aaop.local');
  const [password,     setPassword] = useState('ChangeMe!12345');
  const [displayName,  setDisplay]  = useState('');
  const [workspaceNm,  setWsName]   = useState('My Workspace');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      if (mode === 'credentials') {
        await login(email, password, true);
      } else {
        await register({ email, password, display_name: displayName || undefined, workspace_name: workspaceNm });
      }
      router.replace('/dashboard');
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box sx={{
      width: '100%', maxWidth: 460,
      background: 'oklch(24% 0.03 195 / 0.78)',
      border: '1px solid oklch(50% 0.04 195 / 0.4)',
      borderRadius: 2,
      p: 3.5,
      backdropFilter: 'blur(18px)',
      boxShadow: 'var(--shadow-lg)',
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""', position: 'absolute', inset: 0,
        background: 'radial-gradient(600px 240px at 50% -10%, oklch(78% 0.14 200 / 0.18), transparent 60%)',
        pointerEvents: 'none',
      },
    }}>
      <Box sx={{ position: 'relative' }}>
        <Box className="eyebrow eyebrow-cyan" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <Box className="dot dot-pulse" sx={{ color: 'var(--accent-cyan)' }} />
          Secure Tenant Access · v4.2.1
        </Box>
        <Typography sx={{
          fontFamily: 'var(--ff-serif)', fontSize: 28, lineHeight: 1.15, color: 'var(--ink)',
        }}>
          {mode === 'register'
            ? <>Provision a new<br/><em>orchestration plane</em></>
            : <>Sign in to your<br /><em>orchestration plane</em></>}
        </Typography>
        <Typography sx={{ fontSize: 13, color: 'var(--ink-soft)', mt: 1 }}>
          {mode === 'register'
            ? 'Create an admin account and a private workspace. You can invite members afterwards.'
            : 'Connect to your agents, MCP servers, and orchestration runs across every region.'}
        </Typography>

        <Tabs
          value={mode}
          onChange={(_, v: Mode) => { setMode(v); setErr(null); }}
          sx={{
            mt: 3, mb: 2,
            borderBottom: '1px solid oklch(50% 0.04 195 / 0.3)',
            minHeight: 36,
            '.MuiTab-root': { minHeight: 36, fontSize: 11, fontWeight: 600, textTransform: 'none', color: 'var(--ink-muted)', gap: 0.75 },
            '.Mui-selected': { color: 'var(--ink)' },
          }}
          variant="scrollable"
        >
          <Tab value="credentials" iconPosition="start" icon={<IconUsers size={14} />} label="Credentials" />
          <Tab value="register"    iconPosition="start" icon={<IconChip size={14} />}  label="New tenant" />
          <Tab value="sso"         iconPosition="start" icon={<IconShield size={14} />} label="Federated SSO" />
          <Tab value="passkey"     iconPosition="start" icon={<IconFingerprint size={14} />} label="Passkey" />
        </Tabs>

        {err && <Alert severity="error" sx={{ mb: 2, fontSize: 12 }}>{err}</Alert>}

        {(mode === 'credentials' || mode === 'register') && (
          <Box component="form" onSubmit={onSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {mode === 'register' && (
              <>
                <TextField
                  label="Display name" size="small" fullWidth
                  value={displayName} onChange={e => setDisplay(e.target.value)}
                  autoComplete="name"
                />
                <TextField
                  label="Workspace name" size="small" fullWidth
                  value={workspaceNm} onChange={e => setWsName(e.target.value)}
                />
              </>
            )}
            <TextField
              label="Email" type="email" size="small" fullWidth required
              value={email} onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
            <TextField
              label="Password" type="password" size="small" fullWidth required
              value={password} onChange={e => setPassword(e.target.value)}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            />

            <Button
              type="submit"
              variant="contained" color="primary" size="medium"
              disabled={busy}
              endIcon={<IconChevron size={14} />}
              sx={{ mt: 1, py: 1.1, fontSize: 13 }}
            >
              {busy ? 'Authorizing…' : (mode === 'register' ? 'Create workspace · Continue' : 'Continue · Authorize Session')}
            </Button>

            <Box sx={{
              mt: 2, mb: 1,
              display: 'flex', alignItems: 'center', gap: 1.5,
              color: 'var(--ink-soft)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.18em',
              '&::before, &::after': { content: '""', flex: 1, height: 1, background: 'oklch(50% 0.04 195 / 0.3)' },
            }}>or sign in with</Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
              {[
                { mark: 'M', label: 'Microsoft Entra' },
                { mark: 'G', label: 'Google'         },
                { mark: 'O', label: 'Okta'           },
              ].map(p => (
                <Button key={p.mark} variant="outlined" size="small" disabled
                        sx={{ textTransform: 'none', justifyContent: 'flex-start', gap: 1, fontSize: 11 }}>
                  <Box sx={{
                    width: 22, height: 22, borderRadius: 0.75,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    background: 'oklch(35% 0.05 200 / 0.6)', color: 'var(--accent-cyan)', fontWeight: 700,
                  }}>{p.mark}</Box>
                  {p.label}
                </Button>
              ))}
            </Box>
          </Box>
        )}

        {mode === 'sso' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <TextField label="Identity provider" size="small" defaultValue="acme-corp.okta.com" disabled
                       InputProps={{ startAdornment: <InputAdornment position="start"><IconShield size={14} /></InputAdornment> }} />
            {['Microsoft Entra ID','Okta Workforce','Google Workspace','PingFederate','OneLogin','SAML 2.0 (custom)'].map(p => (
              <Button key={p} variant="outlined" size="small" disabled
                      sx={{ justifyContent: 'space-between', textTransform: 'none', fontSize: 12 }}
                      endIcon={<IconChevron size={14} />}>
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{
                    width: 22, height: 22, borderRadius: 0.75,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    background: 'oklch(35% 0.05 200 / 0.6)', color: 'var(--accent-cyan)', fontWeight: 700,
                  }}>{p[0]}</Box>
                  {p}
                </Box>
              </Button>
            ))}
            <Typography sx={{ fontSize: 11, color: 'var(--ink-soft)', mt: 1.5 }}>
              SSO providers will be enabled in Phase 5. For now, use Credentials.
            </Typography>
          </Box>
        )}

        {mode === 'passkey' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', textAlign: 'center', py: 1.5 }}>
            <Box sx={{
              position: 'relative', width: 110, height: 110,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {[1,2,3].map(i => (
                <Box key={i} sx={{
                  position: 'absolute', inset: 0,
                  border: '1px solid oklch(78% 0.14 200 / 0.4)',
                  borderRadius: '50%',
                  transform: `scale(${0.55 + i * 0.18})`,
                  animation: `pulseRing 3s ${i * 0.4}s infinite`,
                  '@keyframes pulseRing': {
                    '0%, 100%': { opacity: 0.2 },
                    '50%':       { opacity: 0.7 },
                  },
                }} />
              ))}
              <Box sx={{ color: 'var(--accent-cyan)' }}><IconFingerprint size={48} /></Box>
            </Box>
            <Typography sx={{ fontFamily: 'var(--ff-serif)', fontSize: 18 }}>Touch your security device</Typography>
            <Typography sx={{ fontSize: 12, color: 'var(--ink-soft)', maxWidth: 320 }}>
              Awaiting hardware-backed credential. Use a roaming authenticator, platform key, or YubiKey 5 series.
            </Typography>
            <Button variant="contained" color="primary" disabled startIcon={<IconKey size={14} />}>
              Authenticate with passkey
            </Button>
            <Typography sx={{ fontSize: 11, color: 'var(--ink-soft)' }}>
              FIDO2 / WebAuthn support arrives in Phase 5.
            </Typography>
          </Box>
        )}

        <Box sx={{
          mt: 3, pt: 2, borderTop: '1px solid oklch(50% 0.04 195 / 0.25)',
          display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1,
          fontSize: 10.5, color: 'var(--ink-soft)',
        }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
            <IconShield size={11} /> SOC 2 · ISO 27001 · HIPAA · FedRAMP Moderate
          </Box>
          <Box className="mono">tenant://atlas-prod · region:us-ashburn-1</Box>
        </Box>
      </Box>
    </Box>
  );
}
