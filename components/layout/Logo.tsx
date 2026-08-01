import Link from "next/link";
import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 font-mono font-semibold tracking-tight whitespace-nowrap",
        className
      )}
    >
      <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <Sparkles className="size-4" />
      </span>
      SaaS Starter
    </Link>
  );
}
