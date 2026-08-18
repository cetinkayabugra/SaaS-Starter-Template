"use client";

import { KeyRound } from "lucide-react";
import { SiNextdotjs, SiPostgresql, SiPrisma, SiStripe, SiTailwindcss } from "react-icons/si";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const STACK = [
  {
    name: "Next.js",
    icon: SiNextdotjs,
    description: "React framework — App Router, Server Actions, and route handlers",
  },
  { name: "Prisma", icon: SiPrisma, description: "Type-safe ORM for the schema and migrations" },
  { name: "PostgreSQL", icon: SiPostgresql, description: "The relational database" },
  // Auth.js has no brand mark in simple-icons — a plain key icon avoids
  // misrepresenting it as Auth0 or another product.
  {
    name: "Auth.js",
    icon: KeyRound,
    description: "Authentication — email/password and Google OAuth sessions",
  },
  {
    name: "Stripe",
    icon: SiStripe,
    description: "Subscription billing, Checkout, and the Customer Portal",
  },
  { name: "Tailwind CSS", icon: SiTailwindcss, description: "Utility-first styling" },
];

export function TechStack() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 pt-4">
      {STACK.map(({ name, icon: Icon, description }) => (
        <Tooltip key={name}>
          <TooltipTrigger
            aria-label={name}
            className="text-foreground/60 transition-colors hover:text-foreground"
          >
            <Icon className="size-6" />
          </TooltipTrigger>
          <TooltipContent>
            <span className="font-medium text-foreground">{name}</span> — {description}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
