import { describe, expect, it } from "vitest";

import { isDuplicateEventError } from "@/lib/stripe-events";

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
