import type { NextConfig } from "next";

// ponytail: Cache Components are off. Every page reads the session and language
// cookies, so there is no static shell to prerender. Turn on `cacheComponents` and
// `partialPrefetching` once there is cacheable data (Next 17 makes it the default).
const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Content-Security-Policy needs a fresh nonce per request, so it is set in src/proxy.ts.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" }, // legacy twin of frame-ancestors in the CSP
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
    ];
  },
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
