import { KeyRound } from "lucide-react";
import { SiNextdotjs, SiPostgresql, SiPrisma, SiStripe, SiTailwindcss } from "react-icons/si";

const STACK = [
  { name: "Next.js", icon: SiNextdotjs },
  { name: "Prisma", icon: SiPrisma },
  { name: "PostgreSQL", icon: SiPostgresql },
  // Auth.js has no brand mark in simple-icons — a plain key icon avoids
  // misrepresenting it as Auth0 or another product.
  { name: "Auth.js", icon: KeyRound },
  { name: "Stripe", icon: SiStripe },
  { name: "Tailwind CSS", icon: SiTailwindcss },
];

export function TechStack() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 pt-4">
      {STACK.map(({ name, icon: Icon }) => (
        <Icon
          key={name}
          aria-label={name}
          className="size-6 text-foreground/60 transition-colors hover:text-foreground"
        />
      ))}
    </div>
  );
}
