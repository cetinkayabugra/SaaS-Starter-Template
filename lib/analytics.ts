"use client";

import posthog from "posthog-js";

let enabled = false;

export function initAnalytics() {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key || enabled) return;

  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: "history_change",
  });
  enabled = true;
}

export function identifyUser(id: string, properties?: Record<string, unknown>) {
  if (enabled) posthog.identify(id, properties);
}

export function resetUser() {
  if (enabled) posthog.reset();
}

export function trackEvent(name: string, properties?: Record<string, unknown>) {
  if (enabled) posthog.capture(name, properties);
}
