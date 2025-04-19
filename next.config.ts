import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // Configure experimental features
  experimental: {
    serverActions: {
      // Increase the timeout for server actions
      bodySizeLimit: '5mb',
    },
  },
};

export default nextConfig;
