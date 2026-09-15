import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    // Sparing VM CPU and RAM during Docker build (already verified in CI)
    ignoreBuildErrors: true,
  },
};


export default nextConfig;
