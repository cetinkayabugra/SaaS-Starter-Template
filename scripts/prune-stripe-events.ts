/**
 * Deletes ProcessedStripeEvent rows past their retention window.
 *
 * The webhook handler records every event id forever to stay idempotent, so
 * the table grows with traffic and nothing removes rows on its own. Run this
 * on a schedule (cron, a scheduled job on your host, etc.):
 *
 *   pnpm prune:stripe-events
 *
 * Reads .env when present, otherwise the ambient environment — so the same
 * command works locally and in a deployed environment.
 */
import { prisma } from "@/lib/prisma";
import { EVENT_RETENTION_DAYS, eventPruneCutoff } from "@/lib/stripe-events";

async function main() {
  const cutoff = eventPruneCutoff();

  const { count } = await prisma.processedStripeEvent.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });

  console.log(
    `Pruned ${count} processed Stripe event(s) older than ${EVENT_RETENTION_DAYS} days (before ${cutoff.toISOString()}).`
  );
}

main()
  .catch((error) => {
    console.error("Failed to prune processed Stripe events:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
