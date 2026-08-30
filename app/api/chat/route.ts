import Anthropic from "@anthropic-ai/sdk";

import { env } from "@/lib/env";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { chatRequestSchema } from "@/lib/validations";

// This endpoint is intentionally public (the widget renders on marketing pages
// too), so every request costs money with no account behind it. Keep the
// rate limit, the history caps in chatRequestSchema, and max_tokens tight.
const RATE_LIMIT = { limit: 10, windowMs: 60_000 };
const MAX_TOKENS = 1024;

const SYSTEM_PROMPT = `You are the assistant for SaaS Starter, an open-source Next.js SaaS starter template.

The template ships with:
- Auth.js v5 authentication (email/password + Google OAuth)
- Stripe subscription billing (Checkout, Customer Portal, webhook-synced status)
- PostgreSQL via Prisma
- A protected dashboard and billing page
- Tailwind CSS + shadcn/ui components

Help visitors understand what the template includes and how to set it up. Be concise — you're in a small chat window, so keep answers to a few sentences unless asked for detail.

If you don't know something about this specific template, say so rather than guessing. Don't invent features, pricing, or configuration options that aren't listed above.`;

export async function POST(req: Request) {
  if (!env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "Chat is not configured on this deployment." },
      { status: 503 }
    );
  }

  const { ok, resetAt } = rateLimit(getClientIp(req), RATE_LIMIT);
  if (!ok) {
    return Response.json(
      { error: "Too many messages. Please wait a moment and try again." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)) },
      }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  // Identity-linked API keys are rejected unless the request names the
  // workspace it acts in. The SDK only reads ANTHROPIC_WORKSPACE_ID on its
  // federation/OAuth paths, not for a plain apiKey, so pass it as a header.
  const client = new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
    ...(env.ANTHROPIC_WORKSPACE_ID && {
      defaultHeaders: { "anthropic-workspace-id": env.ANTHROPIC_WORKSPACE_ID },
    }),
  });

  const stream = client.messages.stream({
    model: "claude-opus-5",
    max_tokens: MAX_TOKENS,
    // Chat is latency-sensitive and these answers are short, so low effort
    // is the right trade here — it keeps replies snappy and costs down.
    output_config: { effort: "low" },
    system: SYSTEM_PROMPT,
    messages: parsed.data.messages,
  });

  try {
    // stream() doesn't throw on its own — errors surface while iterating. Pull
    // the first text chunk here, before we commit to a 200 + streaming body, so
    // auth/rate-limit/validation failures still come back as real status codes
    // instead of a 200 with an error message baked into the response text.
    const iterator = stream[Symbol.asyncIterator]();
    let firstText: string | undefined;

    while (firstText === undefined) {
      const { done, value } = await iterator.next();
      if (done) break;
      if (value.type === "content_block_delta" && value.delta.type === "text_delta") {
        firstText = value.delta.text;
      }
    }

    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          if (firstText) controller.enqueue(encoder.encode(firstText));

          while (true) {
            const { done, value } = await iterator.next();
            if (done) break;
            if (
              value.type === "content_block_delta" &&
              value.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(value.delta.text));
            }
          }
        } catch (error) {
          // Headers are already sent, so the status can't change here — surface
          // something readable rather than truncating silently mid-sentence.
          console.error("chat stream failed mid-response:", error);
          controller.enqueue(
            encoder.encode("\n\n[The response was interrupted. Please try again.]")
          );
        } finally {
          controller.close();
        }
      },
      cancel() {
        stream.abort();
      },
    });

    return new Response(body, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    stream.abort();
    console.error("chat request failed:", error);

    if (error instanceof Anthropic.RateLimitError) {
      return Response.json(
        { error: "The assistant is busy right now. Please try again shortly." },
        { status: 429 }
      );
    }
    // The request body is already validated by this point, so a 401/400 from
    // the API means server-side config is wrong (bad key, missing workspace
    // id) — not that the caller sent something bad. The logged error above
    // carries the specific reason.
    if (
      error instanceof Anthropic.AuthenticationError ||
      error instanceof Anthropic.BadRequestError
    ) {
      return Response.json(
        { error: "Chat is misconfigured on this deployment." },
        { status: 503 }
      );
    }
    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
