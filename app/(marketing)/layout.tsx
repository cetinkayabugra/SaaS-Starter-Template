import Link from "next/link";

import { auth } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/layout/Logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { FooterLinks } from "@/components/layout/FooterLinks";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Logo />
          <nav className="flex items-center gap-2">
            <ThemeToggle />
            {session?.user ? (
              <Link href="/dashboard" className={buttonVariants()}>
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/sign-in" className={buttonVariants({ variant: "ghost" })}>
                  Sign in
                </Link>
                <Link href="/sign-up" className={buttonVariants()}>
                  Get started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t px-6 py-8 text-sm text-muted-foreground">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
          <p>© {new Date().getFullYear()} SaaS Starter. All rights reserved.</p>
          <FooterLinks />
        </div>
      </footer>
    </div>
  );
}
