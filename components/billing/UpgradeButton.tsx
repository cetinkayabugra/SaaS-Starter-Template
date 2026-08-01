"use client";

import { useTransition } from "react";

import { createCheckoutSession } from "@/actions/billing";
import { Button } from "@/components/ui/button";

export function UpgradeButton({ priceId, label }: { priceId: string; label: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      disabled={isPending}
      onClick={() => startTransition(() => createCheckoutSession(priceId))}
    >
      {isPending ? "Redirecting…" : label}
    </Button>
  );
}
