"use client";

import { Check } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const FEATURE_DESCRIPTIONS: Record<string, string> = {
  "1 project": "Run one active project on the Free plan — upgrade anytime as you grow.",
  "Community support": "Get help via GitHub issues and discussions.",
  "Unlimited projects": "No cap on the number of projects you can run.",
  "Priority support": "Faster, prioritized responses from the team instead of community support.",
  "Everything in Pro": "Includes every Pro plan feature, plus what's below.",
  "Team seats": "Invite teammates to collaborate on your account.",
};

export function PlanFeatureList({ features }: { features: readonly string[] }) {
  return (
    <ul className="flex flex-col gap-2.5 text-sm">
      {features.map((feature) => {
        const description = FEATURE_DESCRIPTIONS[feature];
        return (
          <li key={feature} className="flex items-start gap-2 text-muted-foreground">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" />
            {description ? (
              <Tooltip>
                <TooltipTrigger className="text-left underline decoration-muted-foreground/50 decoration-dotted underline-offset-4 hover:text-foreground">
                  {feature}
                </TooltipTrigger>
                <TooltipContent>{description}</TooltipContent>
              </Tooltip>
            ) : (
              <span>{feature}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
