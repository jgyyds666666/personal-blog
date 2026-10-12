import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ['*.dev.coze.site'],
  // Bundle the SDK and its PostgreSQL dependency into server chunks for Coze FaaS.
  transpilePackages: ['coze-coding-dev-sdk', 'pg'],
  async headers() {
    return [
      { source: '/', headers: [{ key: 'Cache-Control', value: 'private, no-store' }] },
      { source: '/documents/:path*', headers: [
        { key: 'Cache-Control', value: 'private, no-store' },
        { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        { key: 'Referrer-Policy', value: 'no-referrer' },
      ] },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
