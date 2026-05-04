'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';
import { NavRail } from './NavRail';
import { TopBar } from './TopBar';
import { StatusTicker } from './StatusTicker';
import { useAuth } from '@/lib/auth/AuthContext';

interface AppShellProps {
  breadcrumb?: string[];
  title?: React.ReactNode;
  children: React.ReactNode;
}

export function AppShell({ breadcrumb, title, children }: AppShellProps) {
  const { ready, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user) router.replace('/login');
  }, [ready, user, router]);

  if (!ready || !user) {
    return (
      <Box sx={{
        minHeight: '100dvh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <CircularProgress size={20} />
      </Box>
    );
  }

  return (
    <Box className="bg-glow" sx={{ minHeight: '100dvh', display: 'flex' }}>
      <NavRail />
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <TopBar breadcrumb={breadcrumb} />
        {title && (
          <Box sx={{
            px: { xs: 2, md: 4.5 }, pt: 3, pb: 2,
            maxWidth: 1700, mx: 'auto', width: '100%',
          }}>
            {title}
          </Box>
        )}
        <Box component="main" sx={{
          flex: 1,
          maxWidth: 1700, mx: 'auto', width: '100%',
          px: { xs: 2, md: 4.5 },
          pb: 6,
        }}>
          {children}
        </Box>
        <StatusTicker />
      </Box>
    </Box>
  );
}
