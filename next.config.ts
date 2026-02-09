import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  // Suppresses source map upload logs during build
  silent: true,

  org: process.env.SENTRY_ORG || "recruitos",
  project: process.env.SENTRY_PROJECT || "recruitos-web",

  // Upload larger set of source maps for more readable stack traces
  widenClientFileUpload: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,
});
