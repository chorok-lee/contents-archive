import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Loaded from node_modules at runtime instead of bundled (linkedom has optional deps webpack can't resolve).
  serverExternalPackages: ["linkedom", "@mozilla/readability"],
  // The feed moved to the home screen.
  async redirects() {
    return [{ source: "/archive", destination: "/", permanent: false }];
  },
};

export default nextConfig;
