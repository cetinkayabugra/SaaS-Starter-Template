import { SubscriptionStatus } from "@/lib/generated/prisma/enums";

export function isSubscriptionActive(status: SubscriptionStatus | null | undefined): boolean {
  return status === SubscriptionStatus.ACTIVE || status === SubscriptionStatus.TRIALING;
}
