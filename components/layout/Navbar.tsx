"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Navbar() {
  const { data: session } = useSession();
  const initial = session?.user?.name?.[0] ?? session?.user?.email?.[0] ?? "?";

  return (
    <header className="flex items-center justify-between border-b px-6 py-4">
      <nav className="flex items-center gap-6">
        <Link href="/dashboard" className="text-lg font-semibold">
          SaaS Starter
        </Link>
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
          Dashboard
        </Link>
        <Link
          href="/account/billing"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Billing
        </Link>
      </nav>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon">
              <Avatar>
                <AvatarFallback>{initial.toUpperCase()}</AvatarFallback>
              </Avatar>
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
