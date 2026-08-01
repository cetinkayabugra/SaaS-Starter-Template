import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UpgradeButton } from "@/components/billing/UpgradeButton";

export function PlanCard({
  label,
  priceId,
  features,
  isCurrent,
}: {
  label: string;
  priceId: string | null;
  features: readonly string[];
  isCurrent: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{label}</CardTitle>
        {isCurrent && <Badge variant="secondary">Current plan</Badge>}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
          {features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
        {!isCurrent && priceId && <UpgradeButton priceId={priceId} label={`Upgrade to ${label}`} />}
      </CardContent>
    </Card>
  );
}
