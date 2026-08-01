"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { createPortalSession } from "@/actions/billing";
import { Button } from "@/components/ui/button";

export function ManageBillingButton() {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      try {
        const result = await createPortalSession();
        if (result?.error) toast.error(result.error);
      } catch {
        toast.error("Couldn't reach the server. Check your connection and try again.");
      }
    });
  }

  return (
    <Button variant="outline" disabled={isPending} onClick={handleClick}>
      {isPending ? "Redirecting…" : "Manage billing"}
    </Button>
  );
}
