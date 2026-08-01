"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { createCheckoutSession } from "@/actions/billing";
import { Button } from "@/components/ui/button";

export function UpgradeButton({ priceId, label }: { priceId: string; label: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      try {
        const result = await createCheckoutSession(priceId);
        if (result?.error) toast.error(result.error);
      } catch {
        toast.error("Couldn't reach the server. Check your connection and try again.");
      }
    });
  }

  return (
    <Button disabled={isPending} onClick={handleClick}>
      {isPending ? "Redirecting…" : label}
    </Button>
  );
}
