import { env } from "@/lib/env";

export const PLANS = [
  {
    name: "free",
    label: "Free",
    priceLabel: "$0",
    priceId: null,
    popular: false,
    features: ["1 project", "Community support"],
  },
  {
    name: "pro",
    label: "Pro",
    priceLabel: "$19",
    priceId: env.STRIPE_PRICE_ID_PRO,
    popular: true,
    features: ["Unlimited projects", "Priority support"],
  },
  {
    name: "team",
    label: "Team",
    priceLabel: "$49",
    priceId: env.STRIPE_PRICE_ID_TEAM,
    popular: false,
    features: ["Everything in Pro", "Team seats"],
  },
] as const;

export function planForPriceId(priceId: string | null | undefined) {
  return PLANS.find((p) => p.priceId === priceId)?.name ?? "free";
}
