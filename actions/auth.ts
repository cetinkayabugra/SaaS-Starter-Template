"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { stripe } from "@/lib/stripe";
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
    const customer = await stripe.customers.create({
      email: data.email,
      name: data.name,
    });

    await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        hashedPassword,
        stripeCustomerId: customer.id,
      },
    });

    return { success: true as const };
  } catch (error) {
    console.error("signUp failed:", error);
    return { error: "Something went wrong creating your account. Please try again." };
  }
}
