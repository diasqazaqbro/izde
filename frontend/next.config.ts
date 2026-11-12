import type { NextConfig } from "next";

// ponytail: Cache Components are off. Every page reads the session and language
// cookies, so there is no static shell to prerender. Turn on `cacheComponents` and
// `partialPrefetching` once there is cacheable data (Next 17 makes it the default).
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
