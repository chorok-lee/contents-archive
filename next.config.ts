import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Loaded from node_modules at runtime instead of bundled (linkedom has optional deps webpack can't resolve).
  serverExternalPackages: ["linkedom", "@mozilla/readability"],
  // The feed lives on /list; home is the starting screen.
  async redirects() {
    return [
      { source: "/archive", destination: "/list", permanent: false },
      // The keyword filter moved from the home feed to the list.
      { source: "/", has: [{ type: "query", key: "k" }], destination: "/list", permanent: false },
    ];
  },
};

export default nextConfig;
