import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  serverExternalPackages: ['@sparticuz/chromium-min', 'puppeteer-core'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude chromium from webpack bundling (for production builds)
      config.externals = [...(config.externals || []), '@sparticuz/chromium-min'];
    }
    return config;
  },
};

export default nextConfig;
