import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  outputFileTracingIncludes: {
    '/invoices/[id]/pdf': [
      'node_modules/@sparticuz/chromium/bin/chromium.br',
      'node_modules/@sparticuz/chromium/bin/swiftshader.tar.br',
      'node_modules/@sparticuz/chromium/bin/fonts.tar.br',
      'node_modules/@sparticuz/chromium/bin/al2023.tar.br',
    ],
  },
};

export default nextConfig;
