const REPO = "cetinkayabugra/SaaS-Starter-Template";

export const REPO_URL = `https://github.com/${REPO}`;

// The landing page renders on demand and awaits this, so a slow GitHub API
// would hold up the whole page. The star count is decorative — bail out fast
// and render without it rather than make every visitor wait.
const TIMEOUT_MS = 3000;

export async function getRepoStars(): Promise<number | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}`, {
      headers: { Accept: "application/vnd.github+json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;

    const data = await res.json();
    return typeof data.stargazers_count === "number" ? data.stargazers_count : null;
  } catch {
    return null;
  }
}
