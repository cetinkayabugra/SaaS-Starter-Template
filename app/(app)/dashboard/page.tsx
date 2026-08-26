import { CreditCard, Mail, Sparkles } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSubscriptionActive } from "@/lib/entitlements";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
  });
  const isActive = subscription != null && isSubscriptionActive(subscription.status);
  const plan = isActive ? subscription.plan : "free";
  const initial = (session.user.name?.[0] ?? session.user.email?.[0] ?? "?").toUpperCase();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <Badge variant="secondary" className="capitalize">
          {plan} plan
        </Badge>
      </div>

      <Card>
        <CardHeader className="flex-row items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-primary/20">
            <Sparkles className="size-4 text-primary" />
          </div>
          <CardTitle>Welcome{session.user.name ? `, ${session.user.name}` : ""}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This is a placeholder dashboard. Build your product&apos;s real features here.
        </CardContent>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center gap-3">
            <Avatar className="size-9">
              <AvatarFallback>{initial}</AvatarFallback>
            </Avatar>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            <p className="font-medium">{session.user.name ?? "—"}</p>
            <p className="flex items-center gap-1.5 text-muted-foreground">
              <Mail className="size-3.5" />
              {session.user.email}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-primary/20">
              <CreditCard className="size-4 text-primary" />
            </div>
            <CardTitle className="capitalize">{plan} plan</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            {isActive && subscription.currentPeriodEnd ? (
              <p className="text-muted-foreground">
                Renews {subscription.currentPeriodEnd.toLocaleDateString()}
                {subscription.cancelAtPeriodEnd ? " (cancels at period end)" : ""}
              </p>
            ) : (
              <p className="text-muted-foreground">
                Upgrade for unlimited projects and priority support.
              </p>
            )}
            <Link
              href="/account/billing"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              {isActive ? "Manage billing" : "View plans"}
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
