'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Typography, Alert, CircularProgress } from '@mui/material';
import { api, unwrapError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthContext';

function CallbackInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { refresh } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = params?.get('code');
    const state = params?.get('state');
    const provider = window.location.hostname.includes('microsoft') ? 'microsoft'
      : (params?.get('provider') ?? 'google'); // most providers append "iss" but we keep it simple

    // Best-effort provider detection: check stored marker
    const stored = window.sessionStorage.getItem('aaop:sso_provider');
    const finalProvider = stored ?? provider;

    if (!code || !state) {
      setError('Missing OAuth parameters.');
      return;
    }
    (async () => {
      try {
        await api.post(`/api/v1/auth/sso/${finalProvider}/callback`, { code, state });
        window.sessionStorage.removeItem('aaop:sso_provider');
        await refresh();
        router.replace('/dashboard');
      } catch (e) {
        setError(unwrapError(e).message);
      }
    })();
  }, [params, refresh, router]);

  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Box sx={{ textAlign: 'center', maxWidth: 460 }}>
        {error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography sx={{ fontFamily: 'var(--ff-serif)', fontSize: 22 }}>
              Completing sign-in…
            </Typography>
            <Typography sx={{ fontSize: 13, color: 'var(--ink-soft)', mt: 1 }}>
              Exchanging the authorization code with your identity provider.
            </Typography>
          </>
        )}
      </Box>
    </Box>
  );
}

export default function SsoCallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackInner />
    </Suspense>
  );
}
