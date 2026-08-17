import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlanFeatureList } from "@/components/billing/PlanFeatureList";
import { UpgradeButton } from "@/components/billing/UpgradeButton";
import { cn } from "@/lib/utils";

export function PlanCard({
  label,
  priceLabel,
  priceId,
  features,
  isCurrent,
  popular,
}: {
  label: string;
  priceLabel: string;
  priceId: string | null;
  features: readonly string[];
  isCurrent: boolean;
  popular?: boolean;
}) {
  return (
    <div className="relative">
      {popular && (
        <Badge className="absolute -top-3 left-1/2 z-10 -translate-x-1/2">Most popular</Badge>
      )}
      <Card
        className={cn(
          "transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/5",
          popular && "border-primary shadow-md shadow-primary/10"
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-heading">{label}</CardTitle>
            <p className="mt-1 text-2xl font-semibold">
              {priceLabel}
              <span className="text-sm font-normal text-muted-foreground">/mo</span>
            </p>
          </div>
          {isCurrent && <Badge variant="secondary">Current plan</Badge>}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <PlanFeatureList features={features} />
          {!isCurrent && priceId && (
            <UpgradeButton priceId={priceId} label={`Upgrade to ${label}`} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
