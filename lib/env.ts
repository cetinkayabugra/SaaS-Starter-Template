import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().min(1),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  STRIPE_PRICE_ID_PRO: z.string().min(1),
  STRIPE_PRICE_ID_TEAM: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().min(1),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_WORKSPACE_ID: z.string().optional(),
  // How many proxies in front of the app append to x-forwarded-for. Used to
  // pick the entry your own infrastructure wrote rather than one the client
  // supplied — see getClientIp in lib/rate-limit.ts.
  //
  // Empty is treated as unset so that copying .env.example (where optional
  // vars are written as VAR="") doesn't fail startup. A non-numeric or
  // non-positive value still fails loudly rather than silently defaulting.
  TRUSTED_PROXY_HOPS: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.coerce.number().int().positive().default(1)
  ),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "Invalid environment variables:",
    z.treeifyError(parsed.error)
  );
  throw new Error("Invalid environment variables. Check .env against .env.example.");
}

export const env = parsed.data;
