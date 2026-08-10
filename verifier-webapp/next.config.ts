import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Pin the filesystem root to this app. Without it, Turbopack walks up
    // looking for a lockfile and finds a stray one outside the repository.
    root: import.meta.dirname,
  },
};

export default nextConfig;
