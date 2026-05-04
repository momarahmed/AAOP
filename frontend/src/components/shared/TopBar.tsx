'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Button, IconButton, InputBase, Menu, MenuItem, ListItemIcon, ListItemText, Divider, Typography,
} from '@mui/material';
import { IconBell, IconChevron, IconCog, IconLogout, IconSearch, IconSparkles } from './Icons';
import { useAuth } from '@/lib/auth/AuthContext';

interface TopBarProps {
  breadcrumb?: string[];
  onCommandPalette?: () => void;
}

export function TopBar({ breadcrumb }: TopBarProps) {
  const router = useRouter();
  const { user, currentWorkspace, workspaces, setWorkspace, logout } = useAuth();
  const [wsAnchor, setWsAnchor] = useState<HTMLElement | null>(null);
  const [userAnchor, setUserAnchor] = useState<HTMLElement | null>(null);

  const initials = useMemo(() => {
    const name = user?.display_name || user?.email || '';
    return name
      .split(/\s+|@|\./)
      .filter(Boolean)
      .slice(0, 2)
      .map(s => s[0]?.toUpperCase() ?? '')
      .join('') || 'A';
  }, [user]);

  return (
    <Box
      component="header"
      sx={{
        position: 'sticky', top: 0, zIndex: 8,
        display: 'flex', alignItems: 'center', gap: 2,
        px: { xs: 2, md: 4 }, py: 1.5,
        background: 'oklch(24% 0.03 195 / 0.7)',
        backdropFilter: 'blur(18px)',
        borderBottom: '1px solid oklch(50% 0.04 195 / 0.25)',
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: '0 1 auto' }}>
        {breadcrumb && (
          <Box className="eyebrow" sx={{ display: 'flex', gap: 0.75, alignItems: 'center', whiteSpace: 'nowrap' }}>
            {breadcrumb.map((b, i) => (
              <Box key={`${b}-${i}`} component="span" sx={{
                color: i === breadcrumb.length - 1 ? 'var(--ink-muted)' : 'var(--ink-soft)',
                display: 'inline-flex', alignItems: 'center', gap: 0.5,
              }}>
                {b}{i < breadcrumb.length - 1 && <span style={{ opacity: 0.5 }}>›</span>}
              </Box>
            ))}
          </Box>
        )}
      </Box>

      <Box sx={{
        display: 'flex', alignItems: 'center', flex: 1,
        ml: 2, maxWidth: 520,
        px: 1.5, py: 0.6,
        borderRadius: 1.25,
        background: 'oklch(20% 0.025 195 / 0.6)',
        border: '1px solid oklch(50% 0.04 195 / 0.3)',
        '&:focus-within': { borderColor: 'var(--accent-cyan)' },
      }}>
        <Box sx={{ color: 'var(--ink-soft)', display: 'inline-flex' }}><IconSearch size={14} /></Box>
        <InputBase
          placeholder="Search agents, workflows, runs, policies…"
          sx={{ ml: 1, flex: 1, color: 'var(--ink)', fontSize: 13 }}
        />
        <Box className="mono" sx={{
          fontSize: 10, color: 'var(--ink-soft)',
          border: '1px solid oklch(50% 0.04 195 / 0.4)',
          borderRadius: 0.75, px: 0.6, py: 0.1,
        }}>⌘K</Box>
      </Box>

      <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Button
          size="small"
          onClick={(e) => setWsAnchor(e.currentTarget)}
          endIcon={<IconChevron size={12} />}
          sx={{
            textTransform: 'none', fontWeight: 500, fontSize: 12,
            color: 'var(--ink)',
            background: 'oklch(28% 0.03 195 / 0.6)',
            border: '1px solid oklch(50% 0.04 195 / 0.35)',
            px: 1.5, py: 0.6, borderRadius: 1,
            '&:hover': { background: 'oklch(34% 0.04 195 / 0.7)' },
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 110 }}>
            <Box className="eyebrow" sx={{ fontSize: 9 }}>Workspace</Box>
            <Box sx={{ fontSize: 12 }}>{currentWorkspace?.name ?? 'Select…'}</Box>
          </Box>
        </Button>
        <Menu
          open={!!wsAnchor}
          anchorEl={wsAnchor}
          onClose={() => setWsAnchor(null)}
          slotProps={{ paper: { sx: { minWidth: 220 } } }}
        >
          {workspaces.length === 0 && (
            <MenuItem disabled>No workspaces</MenuItem>
          )}
          {workspaces.map(w => (
            <MenuItem
              key={w.id}
              selected={w.id === currentWorkspace?.id}
              onClick={() => { setWorkspace(w.id); setWsAnchor(null); }}
            >
              <ListItemText
                primary={w.name}
                secondary={w.region}
                primaryTypographyProps={{ fontSize: 13 }}
                secondaryTypographyProps={{ fontSize: 11 }}
              />
            </MenuItem>
          ))}
        </Menu>

        <IconButton size="small" sx={{ color: 'var(--ink-muted)' }} aria-label="ai assistant">
          <IconSparkles size={16} />
        </IconButton>
        <IconButton size="small" sx={{ color: 'var(--ink-muted)' }} aria-label="notifications">
          <IconBell size={16} />
        </IconButton>

        <Button
          size="small"
          onClick={(e) => setUserAnchor(e.currentTarget)}
          sx={{
            textTransform: 'none', minWidth: 0,
            color: 'var(--ink)',
            display: 'flex', alignItems: 'center', gap: 1,
            px: 0.75, py: 0.4,
          }}
        >
          <Box sx={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'oklch(45% 0.07 200 / 0.6)',
            border: '1px solid oklch(70% 0.1 200 / 0.4)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--ff-serif)', fontSize: 13, color: 'var(--ink)',
          }}>
            {initials}
          </Box>
          <Box sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column', alignItems: 'flex-start' }}>
            <Typography sx={{ fontSize: 12 }}>{user?.display_name ?? user?.email ?? 'Operator'}</Typography>
            <Typography sx={{ fontSize: 10, color: 'var(--ink-soft)' }}>{user?.email}</Typography>
          </Box>
        </Button>
        <Menu open={!!userAnchor} anchorEl={userAnchor} onClose={() => setUserAnchor(null)}>
          <MenuItem onClick={() => { setUserAnchor(null); router.push('/profile'); }}>
            <ListItemIcon><IconCog size={14} /></ListItemIcon>
            <ListItemText primary="Profile & Preferences" />
          </MenuItem>
          <Divider />
          <MenuItem onClick={async () => { setUserAnchor(null); await logout(); router.replace('/login'); }}>
            <ListItemIcon><IconLogout size={14} /></ListItemIcon>
            <ListItemText primary="Sign out" />
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
}
