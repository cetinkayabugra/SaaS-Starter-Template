import { Logo } from "@/components/layout/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center gap-6 overflow-hidden p-6">
      <div className="bg-grid-pattern pointer-events-none absolute inset-0 -z-10" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_var(--color-primary)_0%,_transparent_45%)] opacity-10"
      />
      <Logo />
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-lg shadow-black/5 sm:p-8">
        {children}
      </div>
    </div>
  );
}
