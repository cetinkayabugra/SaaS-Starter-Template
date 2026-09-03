"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/Logo";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Next.js strips the message in production and exposes `digest` instead,
    // which correlates with the full stack in the server logs.
    console.error("Unhandled route error:", error);
  }, [error]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 text-center">
      <Logo />
      <div className="flex flex-col items-center gap-2">
        <p className="font-mono text-sm font-medium tracking-wide text-destructive uppercase">
          Error
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          This one&apos;s on us. Try again, and if it keeps happening the details are in
          our logs.
        </p>
        {error.digest && (
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            Reference: {error.digest}
          </p>
        )}
      </div>
      <Button onClick={reset}>
        <RotateCcw className="size-4" />
        Try again
      </Button>
    </div>
  );
}
