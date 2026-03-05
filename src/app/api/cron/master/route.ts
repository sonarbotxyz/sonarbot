import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { runOnchainPipeline } from "@/lib/pipeline/onchain";
import { detectMetricsSignals } from "@/lib/pipeline/metrics-signals";
import { classifyContent } from "@/lib/pipeline/signal-classifier";
import { notifyEnriched } from "@/lib/pipeline/notify";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// ---------------------------------------------------------------------------
// X Pipeline — fetch tweets, classify, insert signals
// ---------------------------------------------------------------------------

const X_API_BASE = "https://api.twitter.com/2";

interface Tweet {
  id: string;
  text: string;
  created_at?: string;
  referenced_tweets?: { type: string }[];
}

async function fetchProjectTweets(handle: string): Promise<Tweet[]> {
  const token = process.env.X_BEARER_TOKEN;
  if (!token || !handle) return [];

  try {
    const query = encodeURIComponent(`from:${handle} -is:reply -is:retweet`);
    const res = await fetch(
      `${X_API_BASE}/tweets/search/recent?query=${query}&max_results=10&tweet.fields=created_at,referenced_tweets`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.data ?? [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// GitHub Pipeline — fetch releases + notable commits
// ---------------------------------------------------------------------------

interface GitHubSignalData {
  title: string;
  description: string;
  source_url: string;
}

async function fetchGitHubSignals(githubUrl: string): Promise<GitHubSignalData[]> {
  if (!githubUrl) return [];

  // Extract owner/repo from URL
  const match = githubUrl.match(/github\.com\/([^/]+\/[^/]+)/);
  if (!match) return [];
  const repo = match[1].replace(/\/$/, "");

  const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
  const token = process.env.GITHUB_TOKEN;
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const signals: GitHubSignalData[] = [];

  try {
    // Check releases (last 48h)
    const relRes = await fetch(`https://api.github.com/repos/${repo}/releases?per_page=3`, { headers });
    if (relRes.ok) {
      const releases = await relRes.json();
      const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
      for (const rel of releases) {
        if (new Date(rel.published_at) > cutoff) {
          signals.push({
            title: `New release: ${rel.tag_name}`,
            description: (rel.body || "").slice(0, 200),
            source_url: rel.html_url,
          });
        }
      }
    }

    // Check recent commits (last 2h for 30-min interval)
    const since = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const commitsRes = await fetch(
      `https://api.github.com/repos/${repo}/commits?per_page=5&since=${since}`,
      { headers }
    );
    if (commitsRes.ok) {
      const commits = await commitsRes.json();
      if (Array.isArray(commits) && commits.length >= 3) {
        signals.push({
          title: `Active development: ${commits.length} commits in the last 2 hours`,
          description: commits.slice(0, 3).map((c: { commit: { message: string } }) => 
            c.commit.message.split("\n")[0]
          ).join("; "),
          source_url: `https://github.com/${repo}/commits`,
        });
      }
    }
  } catch (err) {
    console.error(`GitHub fetch failed for ${repo}:`, err);
  }

  return signals;
}

// ---------------------------------------------------------------------------
// Master Pipeline
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const supabase = getSupabase();
  const results = {
    onchain: { processed: 0, errors: 0 },
    metrics: { signals: 0 },
    x: { tweetsChecked: 0, signals: 0 },
    github: { signals: 0 },
    notifications: { sent: 0 },
  };

  try {
    // ── Step 1: Fetch fresh on-chain data ──
    console.log("[Master] Step 1: On-chain data fetch...");
    results.onchain = await runOnchainPipeline();

    // ── Step 2: Detect metric milestones from fresh snapshots ──
    console.log("[Master] Step 2: Metrics milestone detection...");
    results.metrics = await detectMetricsSignals();

    // ── Step 3: Fetch all projects for X + GitHub checks ──
    const { data: projects } = await supabase
      .from("projects")
      .select("id, name, twitter_handle, github_url, contract_address")
      .eq("is_approved", true);

    if (!projects?.length) {
      return NextResponse.json({
        success: true,
        ...results,
        duration: `${((Date.now() - startTime) / 1000).toFixed(1)}s`,
      });
    }

    // ── Step 4: X Tweet Pipeline ──
    console.log("[Master] Step 3: X tweet pipeline...");
    for (const project of projects) {
      if (!project.twitter_handle) continue;

      const tweets = await fetchProjectTweets(project.twitter_handle);
      results.x.tweetsChecked += tweets.length;

      for (const tweet of tweets) {
        // Dedup: check if this tweet URL already generated a signal
        const sourceUrl = `https://x.com/${project.twitter_handle}/status/${tweet.id}`;
        const { data: existing } = await supabase
          .from("signals")
          .select("id")
          .eq("source_url", sourceUrl)
          .limit(1);

        if (existing && existing.length > 0) continue;

        // Classify with Gemini (with throttle)
        await new Promise((r) => setTimeout(r, 4000));
        const classification = await classifyContent(project.name, tweet.text);
        if (!classification || classification.confidence === "low") continue;

        // Insert signal
        const { data: inserted } = await supabase
          .from("signals")
          .insert({
            project_id: project.id,
            type: classification.type,
            title: classification.title,
            description: classification.description,
            source: "x",
            source_url: sourceUrl,
            confidence: classification.confidence,
            is_published: true,
          })
          .select("id, project_id, type, title, description")
          .single();

        if (inserted) {
          results.x.signals++;
          console.log(`[Master] X signal: ${classification.title} for ${project.name}`);

          // Enrich and notify
          try {
            await notifyEnriched(
              inserted,
              project.name,
              project.twitter_handle || "",
              project.github_url || ""
            );
            results.notifications.sent++;
          } catch (err) {
            console.error(`[Master] Notify failed:`, err);
          }
        }
      }
    }

    // ── Step 5: GitHub Pipeline ──
    console.log("[Master] Step 4: GitHub pipeline...");
    for (const project of projects) {
      if (!project.github_url) continue;

      const ghSignals = await fetchGitHubSignals(project.github_url);

      for (const ghSignal of ghSignals) {
        // Dedup
        const { data: existing } = await supabase
          .from("signals")
          .select("id")
          .eq("source_url", ghSignal.source_url)
          .limit(1);

        if (existing && existing.length > 0) continue;

        // Classify
        await new Promise((r) => setTimeout(r, 4000));
        const classification = await classifyContent(
          project.name,
          `${ghSignal.title}: ${ghSignal.description}`
        );

        const { data: inserted } = await supabase
          .from("signals")
          .insert({
            project_id: project.id,
            type: classification?.type || "new_features_launches",
            title: ghSignal.title,
            description: classification?.description || ghSignal.description,
            source: "github",
            source_url: ghSignal.source_url,
            confidence: classification?.confidence || "medium",
            is_published: true,
          })
          .select("id, project_id, type, title, description")
          .single();

        if (inserted) {
          results.github.signals++;
          console.log(`[Master] GitHub signal: ${ghSignal.title} for ${project.name}`);

          try {
            await notifyEnriched(
              inserted,
              project.name,
              project.twitter_handle || "",
              project.github_url || ""
            );
            results.notifications.sent++;
          } catch (err) {
            console.error(`[Master] Notify failed:`, err);
          }
        }
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Master] Pipeline complete in ${duration}s:`, results);

    return NextResponse.json({
      success: true,
      ...results,
      duration: `${duration}s`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Master] Pipeline error:", error);
    return NextResponse.json(
      { error: "Pipeline failed", duration: `${((Date.now() - startTime) / 1000).toFixed(1)}s` },
      { status: 500 }
    );
  }
}
