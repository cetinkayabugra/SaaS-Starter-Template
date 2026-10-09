import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { Logo } from "@/components/layout/Logo";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  // Signing in again while already signed in is a dead end — the form either
  // no-ops or swaps the session out from under whatever the user was doing.
  // Checking here covers both /sign-in and /sign-up in one place.
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <Logo />
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 sm:p-8">{children}</div>
    </div>
  );
}
