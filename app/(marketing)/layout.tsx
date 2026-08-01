import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/layout/Logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Logo />
          <nav className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/sign-in" className={buttonVariants({ variant: "ghost" })}>
              Sign in
            </Link>
            <Link href="/sign-up" className={buttonVariants()}>
              Get started
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t px-6 py-4 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} SaaS Starter. All rights reserved.
      </footer>
    </div>
  );
}
