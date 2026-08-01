import { auth } from "@/lib/auth";
import { getUserPlan } from "@/lib/entitlements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const session = await auth();
  const plan = session?.user ? await getUserPlan(session.user.id) : "free";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <Badge variant="secondary" className="capitalize">
          {plan} plan
        </Badge>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Welcome{session?.user?.name ? `, ${session.user.name}` : ""}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This is a placeholder dashboard — build your product&apos;s real features here.
        </CardContent>
      </Card>
    </div>
  );
}
