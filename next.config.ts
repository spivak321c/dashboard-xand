import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent build errors from wallet-connect dependencies
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
  experimental: {
  },
};

export default nextConfig;
