"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { ensureStripeCustomerId } from "@/lib/stripe-customer";
import { signUpSchema, type SignUpInput } from "@/lib/validations";

export async function signUp(input: SignUpInput) {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  try {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return { error: "Email already in use" };
    }

    const hashedPassword = await hashPassword(data.password);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        hashedPassword,
      },
    });
    await ensureStripeCustomerId(user);

    return { success: true as const };
  } catch (error) {
    console.error("signUp failed:", error);
    return { error: "Something went wrong creating your account. Please try again." };
  }
}
