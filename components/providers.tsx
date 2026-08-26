"use client";

import { SessionProvider } from "next-auth/react";

import { ThemeProvider } from "@/components/theme-provider";
import { PostHogProvider } from "@/components/posthog-provider";
import { PostHogIdentify } from "@/components/posthog-identify";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PostHogProvider>
        <PostHogIdentify />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </PostHogProvider>
    </SessionProvider>
  );
}
