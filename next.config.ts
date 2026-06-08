import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  serverExternalPackages: ['chrome-aws-lambda', 'puppeteer-core'],
};

export default nextConfig;
