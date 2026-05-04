'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Box, Tooltip } from '@mui/material';
import { Logo } from './Logo';
import {
  IconActivity, IconAlert, IconAgent, IconBolt, IconChip, IconDeploy, IconFlag,
  IconGrid, IconKey, IconScroll, IconShield, IconUsers, IconWorkflow,
} from './Icons';

interface NavItem {
  href: string;
  label: string;
  group: string;
  icon: React.ComponentType<{ size?: number }>;
}

const NAV: NavItem[] = [
  { group: 'Operate', href: '/dashboard',     label: 'Overview',       icon: IconGrid },
  { group: 'Operate', href: '/runs',          label: 'Live Runs',      icon: IconActivity },
  { group: 'Operate', href: '/incidents',     label: 'Incidents',      icon: IconAlert },

  { group: 'Compose', href: '/orchestrations', label: 'Orchestrations', icon: IconWorkflow },
  { group: 'Compose', href: '/agents',         label: 'Agents',         icon: IconAgent },
  { group: 'Compose', href: '/tools',          label: 'Tools & MCP',    icon: IconBolt },

  { group: 'Govern',  href: '/policies',       label: 'Policies',       icon: IconShield },
  { group: 'Govern',  href: '/approvals',      label: 'Approvals',      icon: IconFlag },
  { group: 'Govern',  href: '/audit',          label: 'Audit Log',      icon: IconScroll },

  { group: 'Admin',   href: '/roles',          label: 'Roles & Users',  icon: IconUsers },
  { group: 'Admin',   href: '/secrets',        label: 'Secrets',        icon: IconKey },
  { group: 'Admin',   href: '/deploy',         label: 'Deployments',    icon: IconDeploy },
  { group: 'Admin',   href: '/runtime',        label: 'Runtime',        icon: IconChip },
];

export function NavRail({ collapsed = false }: { collapsed?: boolean }) {
  const pathname = usePathname() ?? '/';

  const groups = Array.from(new Set(NAV.map(n => n.group)));

  return (
    <Box
      component="aside"
      sx={{
        position: 'sticky',
        top: 0,
        flexShrink: 0,
        width: collapsed ? 76 : 244,
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        px: collapsed ? 1.25 : 2,
        py: 2.5,
        borderRight: '1px solid oklch(50% 0.04 195 / 0.25)',
        background: 'oklch(22% 0.03 195 / 0.7)',
        backdropFilter: 'blur(20px)',
        zIndex: 10,
      }}
    >
      <Box sx={{ pl: collapsed ? 0 : 0.5, mb: 1 }}>
        {collapsed ? <Logo size="sm" /> : <Logo size="md" />}
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, overflowY: 'auto', flex: 1, mr: -1, pr: 1 }}>
        {groups.map(group => (
          <Box key={group} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {!collapsed && (
              <Box className="eyebrow" sx={{ pl: 1, mb: 0.5 }}>{group}</Box>
            )}
            {NAV.filter(n => n.group === group).map(item => {
              const Active = pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;
              const inner = (
                <Box
                  component={Link}
                  href={item.href}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1.25,
                    px: collapsed ? 0 : 1.25, py: 0.85,
                    borderRadius: 1,
                    color: Active ? 'var(--ink)' : 'var(--ink-muted)',
                    textDecoration: 'none',
                    fontSize: 12.5, fontWeight: Active ? 600 : 500,
                    background: Active ? 'oklch(40% 0.06 200 / 0.45)' : 'transparent',
                    border: '1px solid',
                    borderColor: Active ? 'oklch(60% 0.08 200 / 0.5)' : 'transparent',
                    boxShadow: Active ? 'inset 0 0 12px oklch(78% 0.14 200 / 0.18)' : 'none',
                    transition: 'background 120ms ease, color 120ms ease',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    '&:hover': { color: 'var(--ink)', background: 'oklch(35% 0.04 200 / 0.35)' },
                  }}
                >
                  <Box sx={{ color: Active ? 'var(--accent-cyan)' : 'inherit', display: 'inline-flex' }}>
                    <Icon size={15} />
                  </Box>
                  {!collapsed && <span>{item.label}</span>}
                </Box>
              );
              return collapsed ? (
                <Tooltip key={item.href} title={item.label} placement="right" arrow>{inner}</Tooltip>
              ) : (
                <Box key={item.href}>{inner}</Box>
              );
            })}
          </Box>
        ))}
      </Box>

      {!collapsed && (
        <Box sx={{
          mt: 'auto', p: 1.25, borderRadius: 1.25,
          border: '1px solid oklch(50% 0.04 195 / 0.3)',
          background: 'oklch(20% 0.025 195 / 0.5)',
        }}>
          <Box className="eyebrow" sx={{ mb: 0.5 }}>Workspace</Box>
          <Box sx={{ fontSize: 12, color: 'var(--ink)' }}>atlas-prod</Box>
          <Box sx={{ fontSize: 11, color: 'var(--ink-soft)' }}>region · us-ashburn-1</Box>
        </Box>
      )}
    </Box>
  );
}
