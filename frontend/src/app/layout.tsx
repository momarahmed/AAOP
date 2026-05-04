import type { Metadata, Viewport } from 'next';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';

import { theme } from '@/theme/theme';
import '@/theme/globals.css';

import { AuthProvider } from '@/lib/auth/AuthContext';

export const metadata: Metadata = {
  title: 'AAOP — AI Agent Orchestration Platform',
  description:
    'Trusted autonomous work platform — design, govern, and continuously improve resilient AI-driven workflows across every digital surface.',
  applicationName: 'AAOP',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0b1f24',
};

// suppressHydrationWarning on <html>/<body>: browser extensions often mutate
// those nodes before hydrate (e.g. `cz-shortcut-listen`), which would otherwise
// trigger a false React 19 / Next 15 hydration mismatch warning.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <AppRouterCacheProvider options={{ key: 'mui', enableCssLayer: false }}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthProvider>{children}</AuthProvider>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
