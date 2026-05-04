'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Chip, IconButton, MenuItem, Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import { AppShell } from '@/components/shared/AppShell';
import { FusionCard } from '@/components/shared/Card';
import { StatusPill } from '@/components/shared/StatusPill';
import {
  IconChip, IconDeploy, IconRefresh, IconScroll, IconSearch, IconShield, IconUsers,
} from '@/components/shared/Icons';
import { api, unwrapError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthContext';
import type { Role } from '@/lib/api/types';
import { DeployAgentModal } from '@/components/roles/DeployAgentModal';

interface MemberRow {
  user_id: string;
  email: string;
  name: string | null;
  role: Role;
  last_seen_at: string | null;
}

const ROLE_DESCRIPTIONS: Record<Role, { label: string; tone: 'cyan'|'amber'|'violet'|'mint'|'rose'|'info'|'ok'|'warn'; desc: string }> = {
  owner:  { label: 'Owner',  tone: 'rose',   desc: 'Full administrative control, including billing and workspace deletion.' },
  admin:  { label: 'Admin',  tone: 'violet', desc: 'Manage members, secrets, policies, and deploy to production.'           },
  editor: { label: 'Editor', tone: 'cyan',   desc: 'Create and modify workflows, run drafts, request approvals.'             },
  runner: { label: 'Runner', tone: 'mint',   desc: 'Trigger published workflow runs and view results.'                       },
  viewer: { label: 'Viewer', tone: 'info',   desc: 'Read-only access to workflows, runs, and dashboards.'                    },
};

export default function RolesPage() {
  const { currentWorkspace } = useAuth();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'members' | 'roles'>('members');
  const [showDeploy, setShowDeploy] = useState(false);

  // Invite form
  const [invEmail, setInvEmail] = useState('');
  const [invRole, setInvRole] = useState<Role>('viewer');
  const [inviting, setInviting] = useState(false);
  const [invErr, setInvErr] = useState<string | null>(null);
  const [invOk, setInvOk] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!currentWorkspace) return;
    setLoading(true);
    try {
      const { data } = await api.get<{ data: MemberRow[] }>(`/api/v1/workspaces/${currentWorkspace.id}/members`);
      setMembers(data.data ?? []);
      setErr(null);
    } catch (e) {
      setErr(unwrapError(e).message);
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace]);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() =>
    members.filter(m =>
      search === '' ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      (m.name ?? '').toLowerCase().includes(search.toLowerCase())
    ),
    [members, search]
  );

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace) return;
    setInviting(true); setInvErr(null); setInvOk(null);
    try {
      await api.post(`/api/v1/workspaces/${currentWorkspace.id}/members`, { email: invEmail, role: invRole });
      setInvOk(`Invited ${invEmail} as ${invRole}.`);
      setInvEmail('');
      await load();
    } catch (ex) {
      setInvErr(unwrapError(ex).message);
    } finally {
      setInviting(false);
    }
  };

  return (
    <AppShell
      breadcrumb={['Govern', 'Roles & Users']}
      title={
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 3, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <Box>
            <Typography sx={{ fontFamily: 'var(--ff-serif)', fontSize: 36, lineHeight: 1.1, color: 'var(--ink)' }}>
              Roles &amp; access <em>policies</em>
            </Typography>
            <Typography sx={{ fontSize: 13, color: 'var(--ink-soft)', mt: 1, maxWidth: 720 }}>
              Define who can do what across orchestrations, agents, MCP servers and policies. Workspace-scoped roles map to per-workflow ACLs (PRD §17.6).
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" size="small" startIcon={<IconRefresh size={13} />} onClick={load}>Refresh</Button>
            <Button variant="outlined" size="small" startIcon={<IconScroll size={13} />}>Export</Button>
            <Button variant="contained" size="small" color="primary" startIcon={<IconDeploy size={13} />} onClick={() => setShowDeploy(true)}>
              Deploy Agent
            </Button>
          </Box>
        </Box>
      }
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{
          display: 'flex', gap: 0.25,
          borderBottom: '1px solid oklch(50% 0.04 195 / 0.3)',
        }}>
          {(['members', 'roles'] as const).map(t => (
            <Box key={t} component="button" onClick={() => setTab(t)} sx={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              px: 2, py: 1.25,
              color: tab === t ? 'var(--ink)' : 'var(--ink-soft)',
              fontSize: 13, fontWeight: 500,
              borderBottom: '2px solid',
              borderColor: tab === t ? 'var(--accent-cyan)' : 'transparent',
              fontFamily: 'inherit', textTransform: 'capitalize',
              mb: '-1px',
            }}>{t}</Box>
          ))}
        </Box>

        {tab === 'members' && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 1.5 }}>
            <FusionCard
              eyebrow={`${members.length} member${members.length === 1 ? '' : 's'}`}
              title="Workspace Members"
              icon={<Box sx={{ color: 'var(--accent-cyan)' }}><IconUsers size={14} /></Box>}
              controls={
                <TextField
                  size="small" placeholder="Search members…"
                  value={search} onChange={e => setSearch(e.target.value)}
                  InputProps={{ startAdornment: <Box sx={{ mr: 1, color: 'var(--ink-soft)' }}><IconSearch size={13} /></Box> }}
                  sx={{ width: 240 }}
                />
              }
            >
              {err && <Alert severity="error" sx={{ mb: 2, fontSize: 12 }}>{err}</Alert>}
              <Box component="table" sx={{
                width: '100%', borderCollapse: 'collapse',
                '& th': { textAlign: 'left', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-soft)', fontWeight: 600, py: 1, borderBottom: '1px solid oklch(50% 0.04 195 / 0.3)' },
                '& td': { py: 1.25, borderBottom: '1px solid oklch(50% 0.04 195 / 0.18)', fontSize: 12, color: 'var(--ink)' },
              }}>
                <thead>
                  <tr><th>Member</th><th>Role</th><th>Last seen</th><th /></tr>
                </thead>
                <tbody>
                  {loading && <tr><td colSpan={4} style={{ color: 'var(--ink-soft)' }}>Loading…</td></tr>}
                  {!loading && filtered.length === 0 && (
                    <tr><td colSpan={4} style={{ color: 'var(--ink-soft)' }}>No members match the current filter.</td></tr>
                  )}
                  {filtered.map(m => (
                    <tr key={m.user_id}>
                      <td>
                        <Stack>
                          <Box sx={{ color: 'var(--ink)' }}>{m.name || m.email.split('@')[0]}</Box>
                          <Box className="mono" sx={{ fontSize: 11, color: 'var(--ink-soft)' }}>{m.email}</Box>
                        </Stack>
                      </td>
                      <td>
                        <StatusPill tone={ROLE_DESCRIPTIONS[m.role].tone} dense>{ROLE_DESCRIPTIONS[m.role].label}</StatusPill>
                      </td>
                      <td className="mono" style={{ color: 'var(--ink-soft)' }}>
                        {m.last_seen_at ? new Date(m.last_seen_at).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        <Tooltip title="Member actions">
                          <IconButton size="small" sx={{ color: 'var(--ink-muted)' }}>
                            <IconChip size={14} />
                          </IconButton>
                        </Tooltip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Box>
            </FusionCard>

            <FusionCard
              eyebrow="RBAC · admin"
              title="Invite Member"
              icon={<Box sx={{ color: 'var(--accent-mint)' }}><IconShield size={14} /></Box>}
            >
              <Box component="form" onSubmit={invite} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {invErr && <Alert severity="error" sx={{ fontSize: 12 }}>{invErr}</Alert>}
                {invOk  && <Alert severity="success" sx={{ fontSize: 12 }}>{invOk}</Alert>}
                <TextField required size="small" type="email" label="Email"
                           value={invEmail} onChange={e => setInvEmail(e.target.value)} />
                <TextField select size="small" label="Role"
                           value={invRole} onChange={e => setInvRole(e.target.value as Role)}>
                  {(Object.keys(ROLE_DESCRIPTIONS) as Role[]).map(r => (
                    <MenuItem key={r} value={r}>
                      {ROLE_DESCRIPTIONS[r].label} — <span style={{ color: 'var(--ink-soft)', fontSize: 11, marginLeft: 4 }}>{ROLE_DESCRIPTIONS[r].desc}</span>
                    </MenuItem>
                  ))}
                </TextField>
                <Button type="submit" variant="contained" color="primary" disabled={inviting} size="small">
                  {inviting ? 'Sending…' : 'Send invite'}
                </Button>
                <Typography sx={{ fontSize: 11, color: 'var(--ink-soft)' }}>
                  The invitee will be added to the workspace immediately. SSO + email-based invites land in Phase 5.
                </Typography>
              </Box>
            </FusionCard>
          </Box>
        )}

        {tab === 'roles' && (
          <FusionCard
            eyebrow="Workspace-scoped"
            title="Role Definitions"
            icon={<Box sx={{ color: 'var(--accent-violet)' }}><IconShield size={14} /></Box>}
          >
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 1.5 }}>
              {(Object.keys(ROLE_DESCRIPTIONS) as Role[]).map(r => {
                const d = ROLE_DESCRIPTIONS[r];
                return (
                  <Box key={r} sx={{
                    p: 1.75, borderRadius: 1.5,
                    background: 'oklch(28% 0.03 195 / 0.55)',
                    border: '1px solid oklch(50% 0.04 195 / 0.3)',
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ fontFamily: 'var(--ff-serif)', fontSize: 18, color: 'var(--ink)' }}>{d.label}</Typography>
                      <StatusPill tone={d.tone} dense>{r}</StatusPill>
                    </Box>
                    <Typography sx={{ fontSize: 12, color: 'var(--ink-muted)', mt: 1 }}>{d.desc}</Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1.25 }}>
                      {gatesFor(r).map(g => (
                        <Chip key={g} size="small" label={g}
                              sx={{ height: 22, fontSize: 10, fontFamily: 'var(--ff-mono)', color: 'var(--ink-muted)' }} />
                      ))}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </FusionCard>
        )}
      </Box>

      <DeployAgentModal open={showDeploy} onClose={() => setShowDeploy(false)} />
    </AppShell>
  );
}

function gatesFor(role: Role): string[] {
  const base = ['workflow.view'];
  if (role === 'viewer') return base;
  if (role === 'runner') return [...base, 'workflow.run'];
  if (role === 'editor') return [...base, 'workflow.run', 'workflow.edit'];
  if (role === 'admin')  return [...base, 'workflow.run', 'workflow.edit', 'workflow.delete', 'workspace.manage'];
  return [...base, 'workflow.run', 'workflow.edit', 'workflow.delete', 'workspace.manage', 'workspace.delete'];
}
