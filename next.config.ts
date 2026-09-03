import type { NextConfig } from "next";

// Applied to every response. Deliberately excludes Content-Security-Policy:
// a useful CSP depends on which third parties a given deployment actually
// loads (PostHog, Stripe, fonts), and a wrong one breaks the app silently.
// Add it per-deployment once those are known.
const securityHeaders = [
  // Don't let the browser second-guess declared content types.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Legacy clickjacking defence; frame-ancestors in a CSP supersedes it.
  { key: "X-Frame-Options", value: "DENY" },
  // Send the origin cross-site, the full URL same-origin, nothing over HTTP.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Opt out of powerful APIs this app never uses.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // The framework banner is free reconnaissance; nothing depends on it.
  poweredByHeader: false,

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
