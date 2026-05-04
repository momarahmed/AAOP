'use client';

import { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, Chip, Stack, TextField, Typography, IconButton, Tooltip } from '@mui/material';
import { AppShell } from '@/components/shared/AppShell';
import { FusionCard } from '@/components/shared/Card';
import { StatusPill } from '@/components/shared/StatusPill';
import { IconBolt, IconCog, IconFingerprint, IconKey, IconUsers } from '@/components/shared/Icons';
import { useAuth } from '@/lib/auth/AuthContext';
import { api, unwrapError } from '@/lib/api/client';
import { passkeyRegister } from '@/lib/auth/webauthn';

interface PasskeyRow {
  id: string;
  credential_id: string;
  label: string | null;
  transports: string[];
  last_used_at: string | null;
  created_at: string | null;
}

export default function ProfilePage() {
  const { user, currentWorkspace } = useAuth();
  const [passkeys, setPasskeys] = useState<PasskeyRow[]>([]);
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const fetchPasskeys = useCallback(async () => {
    try {
      const { data } = await api.get<{ data: PasskeyRow[] }>('/api/v1/auth/webauthn/credentials');
      setPasskeys(data.data ?? []);
    } catch (e) {
      setError(unwrapError(e).message);
    }
  }, []);

  useEffect(() => { void fetchPasskeys(); }, [fetchPasskeys]);

  const onRegister = async () => {
    setBusy(true); setError(null); setOkMsg(null);
    const res = await passkeyRegister(label || undefined);
    if (res.ok) {
      setOkMsg(`Passkey "${label || 'unnamed'}" registered.`);
      setLabel('');
      await fetchPasskeys();
    } else {
      setError(res.error);
    }
    setBusy(false);
  };

  const removePasskey = async (id: string) => {
    setBusy(true); setError(null);
    try {
      await api.delete(`/api/v1/auth/webauthn/credentials/${id}`);
      await fetchPasskeys();
    } catch (e) {
      setError(unwrapError(e).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell
      breadcrumb={['Admin', 'Profile']}
      title={
        <Box>
          <Typography sx={{ fontFamily: 'var(--ff-serif)', fontSize: 36, lineHeight: 1.1, color: 'var(--ink)' }}>
            Profile &amp; <em>preferences</em>
          </Typography>
          <Typography sx={{ fontSize: 13, color: 'var(--ink-soft)', mt: 1, maxWidth: 720 }}>
            Account, multi-factor, and passkeys.
          </Typography>
        </Box>
      }
    >
      <Stack gap={2}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.5 }}>
          <FusionCard
            eyebrow="Account"
            title="Identity"
            icon={<Box sx={{ color: 'var(--accent-cyan)' }}><IconUsers size={14} /></Box>}
          >
            <Stack spacing={1.25}>
              <Row k="Display name" v={user?.display_name ?? '—'} />
              <Row k="Email"        v={user?.email ?? '—'} mono />
              <Row k="MFA"          v={<StatusPill tone={user?.mfa_enabled ? 'ok' : 'warn'} dense>{user?.mfa_enabled ? 'enabled' : 'not enabled'}</StatusPill>} />
              <Row k="Last seen"    v={user?.last_seen_at ? new Date(user.last_seen_at).toLocaleString() : '—'} />
            </Stack>
          </FusionCard>

          <FusionCard
            eyebrow="Workspace"
            title="Active context"
            icon={<Box sx={{ color: 'var(--accent-mint)' }}><IconCog size={14} /></Box>}
          >
            <Stack spacing={1.25}>
              <Row k="Workspace" v={currentWorkspace?.name ?? '—'} />
              <Row k="Region"    v={currentWorkspace?.region ?? '—'} mono />
              <Row k="Plan"      v={currentWorkspace?.plan ?? '—'} mono />
              <Row k="Role"      v={currentWorkspace?.role ?? '—'} />
            </Stack>
          </FusionCard>
        </Box>

        <FusionCard
          eyebrow="WebAuthn / FIDO2"
          title="Passkeys & security keys"
          icon={<Box sx={{ color: 'var(--accent-cyan)' }}><IconFingerprint size={14} /></Box>}
        >
          {error && <Alert severity="error" sx={{ mb: 1.5, fontSize: 12 }}>{error}</Alert>}
          {okMsg && <Alert severity="success" sx={{ mb: 1.5, fontSize: 12 }}>{okMsg}</Alert>}

          <Stack direction={{ xs: 'column', md: 'row' }} gap={1}>
            <TextField size="small" label="Nickname (e.g. YubiKey-laptop)" value={label}
                       onChange={(e) => setLabel(e.target.value)} sx={{ flex: 1 }} />
            <Button variant="contained" color="primary" size="small"
                    onClick={onRegister} disabled={busy}
                    startIcon={<IconKey size={14} />}>
              {busy ? 'Touching device…' : 'Register passkey'}
            </Button>
          </Stack>

          <Stack gap={0.75} sx={{ mt: 2 }}>
            {passkeys.length === 0 ? (
              <Typography sx={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                No passkeys yet. Register one above to enable phishing-resistant sign-in.
              </Typography>
            ) : passkeys.map((p) => (
              <Box key={p.id} sx={{
                p: 1, borderRadius: 1,
                background: 'oklch(28% 0.03 195 / 0.55)',
                border: '1px solid oklch(50% 0.04 195 / 0.3)',
                display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap',
              }}>
                <Chip label={p.label ?? 'unnamed'} size="small" sx={{ height: 22 }} />
                <Box className="mono" sx={{ fontSize: 11, color: 'var(--ink-muted)', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.credential_id.slice(0, 22)}…
                </Box>
                {(p.transports ?? []).map((t) => <Chip key={t} label={t} size="small" variant="outlined" sx={{ height: 20, fontSize: 10 }} />)}
                <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ fontSize: 11, color: 'var(--ink-soft)' }}>
                    last used {p.last_used_at ? new Date(p.last_used_at).toLocaleString() : 'never'}
                  </Box>
                  <Tooltip title="Remove">
                    <IconButton size="small" onClick={() => removePasskey(p.id)} sx={{ color: 'var(--accent-rose)' }}>
                      <IconBolt size={14} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            ))}
          </Stack>
        </FusionCard>
      </Stack>
    </AppShell>
  );
}

function Row({ k, v, mono }: { k: string; v: React.ReactNode; mono?: boolean }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5, borderBottom: '1px solid oklch(50% 0.04 195 / 0.18)' }}>
      <Box className="eyebrow">{k}</Box>
      <Box className={mono ? 'mono' : undefined} sx={{ fontSize: 12, color: 'var(--ink)' }}>{v}</Box>
    </Box>
  );
}
