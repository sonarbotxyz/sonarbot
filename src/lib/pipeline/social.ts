/**
 * Social & Dev pipeline
 * Fetches X followers, engagement, GitHub commits, stars for all projects.
 * Updates the social_metrics table.
 */

import { getSupabase } from "@/lib/supabase";

const X_API_BASE = "https://api.twitter.com/2";

// ---------------------------------------------------------------------------
// X (Twitter) metrics
// ---------------------------------------------------------------------------

interface XMetrics {
  followers: number;
  tweets30d: number;
}

async function fetchXMetrics(handle: string): Promise<XMetrics | null> {
  const token = process.env.X_BEARER_TOKEN;
  if (!token || !handle) return null;

  try {
    // Get user ID and follower count
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const userRes = await fetch(
      `${X_API_BASE}/users/by/username/${handle}?user.fields=public_metrics`,
      { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal }
    );
    clearTimeout(timeout);
    if (!userRes.ok) {
      console.error(`[Social] X user lookup failed for @${handle}: ${userRes.status}`);
      return null;
    }
    const userData = await userRes.json();
    const metrics = userData.data?.public_metrics;
    if (!metrics) return null;

    return {
      followers: metrics.followers_count || 0,
      tweets30d: 0, // Skip tweet count to avoid rate limits
    };
  } catch (err) {
    console.error(`[Social] X fetch failed for @${handle}:`, err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// GitHub metrics
// ---------------------------------------------------------------------------

interface GitHubMetrics {
  commits30d: number;
  stars: number;
}

async function fetchGitHubMetrics(githubUrl: string): Promise<GitHubMetrics | null> {
  if (!githubUrl) return null;

  const match = githubUrl.match(/github\.com\/([^/]+\/[^/]+)/);
  if (!match) {
    // Might be an org URL like github.com/OrgName — try to find main repo
    const orgMatch = githubUrl.match(/github\.com\/([^/]+)\/?$/);
    if (!orgMatch) return null;
    return fetchOrgMetrics(orgMatch[1]);
  }

  const repo = match[1].replace(/\/$/, "");
  return fetchRepoMetrics(repo);
}

async function fetchRepoMetrics(repo: string): Promise<GitHubMetrics | null> {
  const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
  const token = process.env.GITHUB_TOKEN;
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [repoRes, commitsRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${repo}`, { headers }),
      fetch(`https://api.github.com/repos/${repo}/commits?per_page=100&since=${since}`, { headers }),
    ]);

    let stars = 0;
    if (repoRes.ok) {
      const repoData = await repoRes.json();
      stars = repoData.stargazers_count || 0;
    }

    let commits30d = 0;
    if (commitsRes.ok) {
      const commits = await commitsRes.json();
      commits30d = Array.isArray(commits) ? commits.length : 0;
    }

    return { commits30d, stars };
  } catch (err) {
    console.error(`[Social] GitHub fetch failed for ${repo}:`, err);
    return null;
  }
}

async function fetchOrgMetrics(org: string): Promise<GitHubMetrics | null> {
  const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
  const token = process.env.GITHUB_TOKEN;
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    // Get org repos, sort by stars
    const res = await fetch(
      `https://api.github.com/orgs/${org}/repos?sort=stars&per_page=5`,
      { headers }
    );
    if (!res.ok) return null;

    const repos = await res.json();
    if (!Array.isArray(repos) || repos.length === 0) return null;

    let totalStars = 0;
    let totalCommits = 0;
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    for (const repo of repos.slice(0, 3)) {
      totalStars += repo.stargazers_count || 0;

      try {
        const commitsRes = await fetch(
          `https://api.github.com/repos/${repo.full_name}/commits?per_page=100&since=${since}`,
          { headers }
        );
        if (commitsRes.ok) {
          const commits = await commitsRes.json();
          totalCommits += Array.isArray(commits) ? commits.length : 0;
        }
      } catch { /* skip */ }
    }

    return { commits30d: totalCommits, stars: totalStars };
  } catch (err) {
    console.error(`[Social] GitHub org fetch failed for ${org}:`, err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Pipeline runner
// ---------------------------------------------------------------------------

export async function runSocialPipeline(): Promise<{ processed: number; errors: number }> {
  const supabase = getSupabase();

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, twitter_handle, github_url")
    .eq("is_approved", true);

  if (!projects?.length) return { processed: 0, errors: 0 };

  let processed = 0;
  let errors = 0;

  for (const project of projects) {
    try {
      const [xMetrics, ghMetrics] = await Promise.all([
        fetchXMetrics(project.twitter_handle || ""),
        fetchGitHubMetrics(project.github_url || ""),
      ]);

      // Insert new social snapshot
      const xFollowers = xMetrics?.followers ?? null;
      const ghCommits = ghMetrics?.commits30d ?? null;


      const { error } = await supabase
        .from("social_snapshots")
        .insert({
          project_id: project.id,
          x_followers: xFollowers,
          x_engagement_rate: null,
          github_commits_7d: ghCommits,
          github_last_push: ghCommits ? new Date().toISOString() : null,
          farcaster_followers: null,
        });

      if (error) {
        console.error(`[Social] Upsert failed for ${project.name}:`, error);
        errors++;
      } else {
        processed++;
      }
    } catch (err) {
      console.error(`[Social] Failed for ${project.name}:`, err);
      errors++;
    }
  }

  return { processed, errors };
}
