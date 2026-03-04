/**
 * GitHub Signal Pipeline
 *
 * Fetches releases and commit activity from GitHub, classifies notable
 * commits with Gemini, and inserts new signals into the database.
 */

import { getSupabase } from "@/lib/supabase";
import { classifyContent } from "./signal-classifier";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string | null;
  body: string | null;
  html_url: string;
  published_at: string;
}

interface GitHubCommitItem {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: { date: string };
  };
}

interface ProjectForGitHub {
  id: string;
  name: string;
  github_repo: string;
}

interface GitHubPipelineResult {
  projectId: string;
  projectName: string;
  releasesChecked: number;
  commitsChecked: number;
  signalsCreated: number;
  errors: string[];
}

// ---------------------------------------------------------------------------
// GitHub API
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
  const res = await fetch(`${GITHUB_API_BASE}${path}`, {
    headers: getGitHubHeaders(),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API error ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function sourceUrlExists(sourceUrl: string): Promise<boolean> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("signals")
    .select("id")
    .eq("source_url", sourceUrl)
    .limit(1);
  return !!(data && data.length > 0);
}

async function getLastCheckTime(
  projectId: string
): Promise<Date | null> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("signals")
    .select("detected_at")
    .eq("project_id", projectId)
    .eq("source", "github")
    .order("detected_at", { ascending: false })
    .limit(1);

  if (data && data.length > 0) {
    return new Date(data[0].detected_at);
  }
  return null;
}

const NOTABLE_PREFIXES = ["feat:", "fix:", "breaking"];

function isNotableCommit(message: string): boolean {
  const lower = message.toLowerCase();
  return NOTABLE_PREFIXES.some((p) => lower.includes(p));
}

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------

async function processReleases(
  project: ProjectForGitHub,
  lastCheck: Date | null
): Promise<{ signalsCreated: number; releasesChecked: number; errors: string[] }> {
  const result = { signalsCreated: 0, releasesChecked: 0, errors: [] as string[] };

  try {
    const releases = await githubFetch<GitHubRelease[]>(
      `/repos/${project.github_repo}/releases?per_page=5`
    );
    result.releasesChecked = releases.length;

    const supabase = getSupabase();

    for (const release of releases) {
      try {
        if (lastCheck && new Date(release.published_at) <= lastCheck) continue;
        if (await sourceUrlExists(release.html_url)) continue;

        const title = release.name || release.tag_name;
        const description = release.body
          ? release.body.slice(0, 200)
          : `New release: ${release.tag_name}`;

        const { error: insertError } = await supabase.from("signals").insert({
          project_id: project.id,
          type: "new_features_launches",
          title: `Release: ${title}`.slice(0, 100),
          description,
          source: "github",
          source_url: release.html_url,
          confidence: "high",
          detected_at: release.published_at,
        });

        if (insertError) {
          result.errors.push(`Release insert error: ${insertError.message}`);
        } else {
          result.signalsCreated++;
        }
      } catch (relErr) {
        result.errors.push(
          `Release ${release.tag_name}: ${relErr instanceof Error ? relErr.message : String(relErr)}`
        );
      }
    }
  } catch (err) {
    result.errors.push(
      `Releases fetch: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  return result;
}

async function processCommits(
  project: ProjectForGitHub
): Promise<{ signalsCreated: number; commitsChecked: number; errors: string[] }> {
  const result = { signalsCreated: 0, commitsChecked: 0, errors: [] as string[] };

  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const commits = await githubFetch<GitHubCommitItem[]>(
      `/repos/${project.github_repo}/commits?per_page=20&since=${since}`
    );
    result.commitsChecked = commits.length;

    const supabase = getSupabase();

    // If 5+ commits in 24h → activity signal
    if (commits.length >= 5) {
      const activityUrl = `https://github.com/${project.github_repo}/commits`;
      if (!(await sourceUrlExists(`${activityUrl}?since=${since.split("T")[0]}`))) {
        const { error: insertError } = await supabase.from("signals").insert({
          project_id: project.id,
          type: "all_updates",
          title: `Active development: ${commits.length} commits in the last 24h`,
          description: `${project.name} has had ${commits.length} commits in the last 24 hours, indicating active development.`,
          source: "github",
          source_url: `${activityUrl}?since=${since.split("T")[0]}`,
          confidence: "high",
          detected_at: new Date().toISOString(),
        });

        if (insertError) {
          result.errors.push(`Activity insert error: ${insertError.message}`);
        } else {
          result.signalsCreated++;
        }
      }
    }

    // Classify notable individual commits
    const notableCommits = commits.filter((c) =>
      isNotableCommit(c.commit.message)
    );

    for (const commit of notableCommits) {
      try {
        if (await sourceUrlExists(commit.html_url)) continue;

        const classification = await classifyContent(
          project.name,
          commit.commit.message
        );
        if (!classification) continue;
        if (classification.confidence === "low") continue;

        const { error: insertError } = await supabase.from("signals").insert({
          project_id: project.id,
          type: classification.type,
          title: classification.title,
          description: classification.description,
          source: "github",
          source_url: commit.html_url,
          confidence: classification.confidence,
          detected_at: commit.commit.author.date,
        });

        if (insertError) {
          result.errors.push(`Commit insert error: ${insertError.message}`);
        } else {
          result.signalsCreated++;
        }
      } catch (commitErr) {
        result.errors.push(
          `Commit ${commit.sha.slice(0, 7)}: ${commitErr instanceof Error ? commitErr.message : String(commitErr)}`
        );
      }
    }
  } catch (err) {
    result.errors.push(
      `Commits fetch: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  return result;
}

async function processProject(
  project: ProjectForGitHub
): Promise<GitHubPipelineResult> {
  const result: GitHubPipelineResult = {
    projectId: project.id,
    projectName: project.name,
    releasesChecked: 0,
    commitsChecked: 0,
    signalsCreated: 0,
    errors: [],
  };

  const lastCheck = await getLastCheckTime(project.id);

  const [releaseResult, commitResult] = await Promise.all([
    processReleases(project, lastCheck),
    processCommits(project),
  ]);

  result.releasesChecked = releaseResult.releasesChecked;
  result.commitsChecked = commitResult.commitsChecked;
  result.signalsCreated =
    releaseResult.signalsCreated + commitResult.signalsCreated;
  result.errors = [...releaseResult.errors, ...commitResult.errors];

  return result;
}

/**
 * Run the GitHub signal pipeline for all projects with a github_repo.
 */
export async function runGitHubSignalPipeline(): Promise<{
  results: GitHubPipelineResult[];
  totalSignals: number;
}> {
  const supabase = getSupabase();
  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, name, github_repo")
    .eq("is_approved", true)
    .not("github_repo", "is", null)
    .neq("github_repo", "");

  if (error) {
    throw new Error(`Failed to fetch projects: ${error.message}`);
  }

  if (!projects || projects.length === 0) {
    return { results: [], totalSignals: 0 };
  }

  const results: GitHubPipelineResult[] = [];
  for (const project of projects as ProjectForGitHub[]) {
    const r = await processProject(project);
    results.push(r);
    console.log(
      `[GitHub Signals] ${project.name}: ${r.signalsCreated} signals (${r.releasesChecked} releases, ${r.commitsChecked} commits)`
    );
  }

  return {
    results,
    totalSignals: results.reduce((sum, r) => sum + r.signalsCreated, 0),
  };
}
