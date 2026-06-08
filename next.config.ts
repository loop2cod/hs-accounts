import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  outputFileTracingIncludes: {
    '/invoices/[id]/pdf': [
      './node_modules/@sparticuz/chromium/bin/**/*',
    ],
  },
};

export default nextConfig;
