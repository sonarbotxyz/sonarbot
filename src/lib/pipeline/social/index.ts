/**
 * Social Snapshot Pipeline
 *
 * Orchestrates X (Twitter) and GitHub data fetching, then stores
 * snapshots in the social_snapshots table. Runs every 6 hours.
 */

import { getSupabase } from "@/lib/supabase";
import { fetchXData, fetchXDataByUsername } from "./x-api";
import { fetchGitHubActivity } from "./github-api";

// ---------------------------------------------------------------------------
// Snapshot for a single project
// ---------------------------------------------------------------------------

/**
 * Take a social snapshot for a single project.
 * Fetches X data and/or GitHub data depending on what's configured,
 * then inserts a row into social_snapshots.
 *
 * Handles errors gracefully — if X API fails, GitHub data is still saved
 * and vice versa.
 */
export async function takeSocialSnapshot(
  projectId: string,
  xUserId?: string,
  twitterHandle?: string,
  githubRepo?: string
): Promise<void> {

  let xFollowers: number | null = null;
  let xEngagementRate: number | null = null;
  let githubCommits7d: number | null = null;
  let githubLastPush: Date | null = null;
  let githubStars: number | null = null;

  // Fetch X data — prefer user ID, fall back to username lookup
  if (xUserId) {
    try {
      const xData = await fetchXData(xUserId);
      xFollowers = xData.followers;
      xEngagementRate = xData.engagementRate;
    } catch (error) {
      console.error(`X API (by ID) failed for project ${projectId}:`, error);
    }
  } else if (twitterHandle) {
    try {
      const xData = await fetchXDataByUsername(twitterHandle);
      xFollowers = xData.followers;
      xEngagementRate = xData.engagementRate;
    } catch (error) {
      console.error(`X API (by handle) failed for project ${projectId}:`, error);
    }
  }

  // Fetch GitHub data if configured
  if (githubRepo) {
    try {
      const ghData = await fetchGitHubActivity(githubRepo);
      githubCommits7d = ghData.commits7d;
      githubLastPush = ghData.lastPush;
      githubStars = ghData.stars;
    } catch (error) {
      console.error(`GitHub API failed for project ${projectId}:`, error);
    }
  }

  // Insert snapshot into Supabase
  const supabase = getSupabase();
  const { error } = await supabase.from("social_snapshots").insert({
    project_id: projectId,
    x_followers: xFollowers,
    x_engagement_rate: xEngagementRate,
    github_commits_7d: githubCommits7d,
    github_last_push: githubLastPush?.toISOString() ?? null,
    github_stars: githubStars,
  });

  if (error) {
    console.error(
      `Social snapshot insert failed for ${projectId}:`,
      error
    );
    throw error;
  }

}

// ---------------------------------------------------------------------------
// Batch runner — processes all projects with social accounts
// ---------------------------------------------------------------------------

/**
 * Run the social pipeline for all eligible projects.
 * Fetches projects that have x_user_id OR github_repo set,
 * then takes a snapshot for each.
 *
 * Adds a small delay between projects to respect API rate limits.
 */
export async function runSocialPipeline(): Promise<{
  processed: number;
  errors: number;
}> {
  const supabase = getSupabase();

  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, x_user_id, twitter_handle, github_repo")
    .eq("is_approved", true)
    .or("x_user_id.not.is.null,twitter_handle.not.is.null,github_repo.not.is.null");

  if (error) {
    console.error("Failed to fetch projects for social pipeline:", error);
    throw error;
  }

  if (!projects || projects.length === 0) {
    return { processed: 0, errors: 0 };
  }


  let processed = 0;
  let errors = 0;

  for (const project of projects) {
    try {
      await takeSocialSnapshot(
        project.id,
        project.x_user_id ?? undefined,
        project.twitter_handle ?? undefined,
        project.github_repo ?? undefined
      );
      processed++;
    } catch (err) {
      console.error(`Social pipeline error for ${project.id}:`, err);
      errors++;
    }

    // Small delay between projects to respect rate limits
    if (projects.length > 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return { processed, errors };
}
