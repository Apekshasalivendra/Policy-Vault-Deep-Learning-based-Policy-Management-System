import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',   // enables .next/standalone for Docker multi-stage builds
};

export default nextConfig;
