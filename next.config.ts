import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  serverExternalPackages: ['@sparticuz/chromium', 'puppeteer-core'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude chromium from webpack bundling (for production builds)
      config.externals = [...(config.externals || []), '@sparticuz/chromium'];
    }
    return config;
  },
};

export default nextConfig;
