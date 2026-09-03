/**
 * How long a processed-event record stays useful. Stripe retries a failed
 * webhook for up to ~3 days; past that a record can only ever match a
 * redelivery Stripe will never send, so it's safe to drop. The generous
 * default leaves room for backfills and manual replays from the dashboard.
 */
export const EVENT_RETENTION_DAYS = 30;

/** Timestamp before which processed-event records can be deleted. */
export function eventPruneCutoff(
  now: Date = new Date(),
  retentionDays: number = EVENT_RETENTION_DAYS
): Date {
  return new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);
}

/** Prisma's error code for a unique-constraint violation. */
const UNIQUE_VIOLATION = "P2002";

/** Model whose primary key is the Stripe event id. */
const EVENT_MODEL = "ProcessedStripeEvent";

/**
 * True when an error is the unique-constraint violation raised by inserting a
 * Stripe event id that has already been recorded — i.e. Stripe redelivered an
 * event we've handled, and the write should be skipped.
 *
 * The model check matters: other writes in the same transaction can raise
 * P2002 too (Subscription.stripeSubscriptionId, for one). Matching on the code
 * alone would treat a genuine constraint bug as a duplicate delivery, ack the
 * webhook, and lose the write with no retry.
 */
export function isDuplicateEventError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;

  const { code, meta } = error as { code?: unknown; meta?: unknown };
  if (code !== UNIQUE_VIOLATION) return false;

  if (typeof meta !== "object" || meta === null) return false;
  return (meta as { modelName?: unknown }).modelName === EVENT_MODEL;
}
