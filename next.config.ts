import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  experimental: {
    serverMinification: false,
  },
  outputFileTracingIncludes: {
    '/invoices/[id]/pdf': [
      'node_modules/@sparticuz/chromium/bin/*.br',
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      // Ensure @sparticuz/chromium is NOT externalized
      if (Array.isArray(config.externals)) {
        config.externals = config.externals.filter((external: any) => {
          if (typeof external === 'string') {
            return !external.includes('@sparticuz/chromium');
          }
          return true;
        });
      }
    }
    return config;
  },
};

export default nextConfig;
