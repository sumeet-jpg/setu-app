import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Strict mode catches subtle React bugs early
  reactStrictMode: true,

  // Server-side env validation — crash fast if required vars missing
  // (detailed validation is in src/lib/env.ts)
  serverRuntimeConfig: {
    // These are server-only; never exposed to client bundle
  },

  // Only NEXT_PUBLIC_* vars are safe for client
  publicRuntimeConfig: {},

  // Disable X-Powered-By header
  poweredByHeader: false,

  // Enforce HTTPS headers in production
  async headers() {
    if (process.env.NEXT_PUBLIC_APP_ENV !== "production") return [];
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
