import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/layout/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 text-center">
      <Logo />
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-[-0.02em]">Page not found</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          That page doesn&apos;t exist, or it moved. The links above still work.
        </p>
      </div>
      <Link href="/" className={buttonVariants()}>
        Back to home
      </Link>
    </div>
  );
}
