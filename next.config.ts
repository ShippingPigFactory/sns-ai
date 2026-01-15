import type { NextConfig } from "next";

const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // ここで制限を10MBに増やします
    },
  },
};

export default nextConfig;
