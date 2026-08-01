export const PLANS = [
  {
    name: "free",
    label: "Free",
    priceId: null,
    features: ["1 project", "Community support"],
  },
  {
    name: "pro",
    label: "Pro",
    priceId: process.env.STRIPE_PRICE_ID_PRO,
    features: ["Unlimited projects", "Priority support"],
  },
  {
    name: "team",
    label: "Team",
    priceId: process.env.STRIPE_PRICE_ID_TEAM,
    features: ["Everything in Pro", "Team seats"],
  },
] as const;

export function planForPriceId(priceId: string | null | undefined) {
  return PLANS.find((p) => p.priceId === priceId)?.name ?? "free";
}
