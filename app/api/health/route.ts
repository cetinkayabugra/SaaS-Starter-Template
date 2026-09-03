import { prisma } from "@/lib/prisma";

// Never cache a health check — a cached "ok" is worse than no health check.
export const dynamic = "force-dynamic";

/**
 * Liveness/readiness probe for load balancers and uptime monitors.
 *
 * Reports database reachability because that's the dependency whose failure
 * takes the whole app down. Responses are deliberately vague: this endpoint is
 * unauthenticated, so it says whether things work, never why they don't — the
 * detail goes to the server log.
 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    console.error("Health check failed: database unreachable", error);
    return Response.json(
      { status: "degraded", database: "unreachable" },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  return Response.json(
    { status: "ok", database: "ok" },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}
