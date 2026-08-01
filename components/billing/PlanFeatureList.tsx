import { Check } from "lucide-react";

export function PlanFeatureList({ features }: { features: readonly string[] }) {
  return (
    <ul className="flex flex-col gap-2.5 text-sm">
      {features.map((feature) => (
        <li key={feature} className="flex items-start gap-2 text-muted-foreground">
          <Check className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
  );
}
