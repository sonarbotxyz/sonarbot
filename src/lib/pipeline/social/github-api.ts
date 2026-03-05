/**
 * GitHub API Integration
 *
 * Fetches commit activity and last push date from the GitHub REST API.
 * Uses GITHUB_TOKEN from env if available (5000 req/hr), otherwise
 * falls back to unauthenticated access (60 req/hr).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GitHubActivity {
  commits7d: number;
  lastPush: Date | null;
  stars: number;
}

interface GitHubCommit {
  sha: string;
  commit: {
    author: {
      date: string;
    };
  };
}

interface GitHubRepo {
  pushed_at: string | null;
  stargazers_count: number;
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

const GITHUB_API_BASE = "https://api.github.com";

function getGitHubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
  };

  const token = process.env.GITHUB_TOKEN;
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

async function githubFetch<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  const res = await fetch(`${GITHUB_API_BASE}${path}`, {
    headers: getGitHubHeaders(),
    signal: controller.signal,
  });
  clearTimeout(timeout);

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API error ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Data fetchers
// ---------------------------------------------------------------------------

/**
 * Fetch GitHub activity for a repository.
 *
 * @param repo - Repository in 'owner/repo' format
 * @returns commits in last 7 days and last push timestamp
 */
export async function fetchGitHubActivity(
  repo: string
): Promise<GitHubActivity> {
  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  // Fetch commits in last 7 days and repo info in parallel
  const [commits, repoInfo] = await Promise.all([
    githubFetch<GitHubCommit[]>(
      `/repos/${repo}/commits?since=${sevenDaysAgo}&per_page=100`
    ),
    githubFetch<GitHubRepo>(`/repos/${repo}`),
  ]);

  return {
    commits7d: commits.length,
    lastPush: repoInfo.pushed_at ? new Date(repoInfo.pushed_at) : null,
    stars: repoInfo.stargazers_count ?? 0,
  };
}
