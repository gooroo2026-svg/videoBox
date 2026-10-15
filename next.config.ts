import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Keep project discovery and build output scoped to this app instead of the user profile.
    root: process.cwd(),
  },
};

export default nextConfig;
