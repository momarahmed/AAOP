/** @type {import('next').NextConfig} */
// Server-side proxy target for `/api/*` and `/sanctum/*` rewrites.
// In Docker this must be the compose service name + container port
// (http://backend:8000). On host-only dev, point at your published
// Laravel port, e.g. http://127.0.0.1:8002.
const internalApi =
  process.env.INTERNAL_API_URL?.trim() || 'http://127.0.0.1:8000';

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['@mui/material', '@mui/icons-material'],
  },
  /**
   * Same-origin API + Sanctum so the browser can read `XSRF-TOKEN` from
   * `document.cookie` and Axios can attach `X-XSRF-TOKEN`. If the SPA
   * called Laravel on a different host:port, the CSRF cookie would be
   * stored for the API origin and would not appear in `document.cookie`
   * on the page — leading to 419 CSRF token mismatch on login.
   */
  async rewrites() {
    return [
      { source: '/sanctum/:path*', destination: `${internalApi}/sanctum/:path*` },
      { source: '/api/:path*', destination: `${internalApi}/api/:path*` },
    ];
  },
};

export default nextConfig;
