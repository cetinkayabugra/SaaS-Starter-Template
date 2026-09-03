import { describe, expect, it } from "vitest";

import {
  EVENT_RETENTION_DAYS,
  eventPruneCutoff,
  isDuplicateEventError,
} from "@/lib/stripe-events";

// Shape captured from a real Prisma 7 duplicate-primary-key failure against
// Postgres, so these fixtures match what the handler actually catches.
const duplicateEvent = {
  name: "PrismaClientKnownRequestError",
  code: "P2002",
  meta: {
    modelName: "ProcessedStripeEvent",
    driverAdapterError: {
      name: "DriverAdapterError",
      cause: {
        originalCode: "23505",
        originalMessage:
          'duplicate key value violates unique constraint "ProcessedStripeEvent_pkey"',
        kind: "UniqueConstraintViolation",
        constraint: { fields: ["id"] },
      },
    },
  },
};

describe("isDuplicateEventError", () => {
  it("matches a replayed Stripe event", () => {
    expect(isDuplicateEventError(duplicateEvent)).toBe(true);
  });

  it("does NOT match a unique violation on another model", () => {
    // The important case: a Subscription constraint failure is also P2002.
    // Treating it as a duplicate would ack the webhook and lose the write.
    expect(
      isDuplicateEventError({
        ...duplicateEvent,
        meta: { ...duplicateEvent.meta, modelName: "Subscription" },
      })
    ).toBe(false);
  });

  it("does not match a different Prisma error code on the same model", () => {
    expect(isDuplicateEventError({ ...duplicateEvent, code: "P2025" })).toBe(false);
  });

  it("does not match when meta is missing", () => {
    expect(isDuplicateEventError({ code: "P2002" })).toBe(false);
  });

  it("does not match when modelName is absent", () => {
    expect(isDuplicateEventError({ code: "P2002", meta: {} })).toBe(false);
  });

  it.each([
    ["a plain Error", new Error("boom")],
    ["null", null],
    ["undefined", undefined],
    ["a string", "P2002"],
    ["a number", 2002],
  ])("does not match %s", (_label, value) => {
    expect(isDuplicateEventError(value)).toBe(false);
  });

  it("does not throw on an error with a null meta", () => {
    expect(isDuplicateEventError({ code: "P2002", meta: null })).toBe(false);
  });
});

describe("eventPruneCutoff", () => {
  const now = new Date("2026-06-15T12:00:00.000Z");

  it("subtracts the retention window from now", () => {
    // 30 days before 2026-06-15 is 2026-05-16.
    expect(eventPruneCutoff(now).toISOString()).toBe("2026-05-16T12:00:00.000Z");
  });

  it("honours an explicit retention period", () => {
    expect(eventPruneCutoff(now, 1).toISOString()).toBe("2026-06-14T12:00:00.000Z");
  });

  it("returns a cutoff in the past, never the future", () => {
    expect(eventPruneCutoff(now).getTime()).toBeLessThan(now.getTime());
  });

  it("keeps a comfortable margin over Stripe's ~3 day retry window", () => {
    // Pruning inside the retry window would let a redelivery be processed
    // twice, which is the whole thing the table exists to prevent.
    expect(EVENT_RETENTION_DAYS).toBeGreaterThan(3);
  });
});
