import path from 'path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(__dirname, '../../'),
  /* config options here */
  allowedDevOrigins: ['*.dev.coze.site'],
  serverExternalPackages: ['coze-coding-dev-sdk'],
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
