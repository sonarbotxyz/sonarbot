/**
 * Signal Context Enricher
 *
 * Gathers cross-source context (X tweets, on-chain delta, GitHub activity)
 * and generates an AI analysis via Gemini before sending notifications.
 */

import { getSupabase } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OnchainDelta {
  holders: { current: number; previous: number; change: number };
  marketcap: { current: number; previous: number; changePct: number };
  volume24h: { current: number; previous: number; changePct: number };
  liquidity: { current: number; previous: number; changePct: number };
}

export interface SignalContext {
  signal: { type: string; title: string; description: string; project_id: string };
  recentTweets: string[];
  onchainDelta: OnchainDelta | null;
  recentGithubActivity: string | null;
  analysis: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function pctChange(prev: number, current: number): number {
  if (prev === 0) return 0;
  return Math.round(((current - prev) / prev) * 1000) / 10;
}

// ---------------------------------------------------------------------------
// Data fetchers
// ---------------------------------------------------------------------------

const X_API_BASE = "https://api.twitter.com/2";

async function fetchRecentTweets(twitterHandle: string): Promise<string[]> {
  const token = process.env.X_BEARER_TOKEN;
  if (!token || !twitterHandle) return [];

  try {
    const query = encodeURIComponent(`from:${twitterHandle} -is:reply -is:retweet`);
    const url = `${X_API_BASE}/tweets/search/recent?query=${query}&max_results=10&tweet.fields=referenced_tweets`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return [];

    const data = await res.json();
    const tweets = data.data ?? [];

    // Return text of first 3 original tweets
    return tweets
      .slice(0, 3)
      .map((t: { text: string }) => t.text);
  } catch {
    return [];
  }
}

async function fetchOnchainDelta(projectId: string): Promise<OnchainDelta | null> {
  try {
    const supabase = getSupabase();
    const { data: snapshots } = await supabase
      .from("snapshots")
      .select("holders, marketcap, volume_24h, liquidity")
      .eq("project_id", projectId)
      .order("timestamp", { ascending: false })
      .limit(2);

    if (!snapshots || snapshots.length < 2) return null;

    const current = snapshots[0];
    const previous = snapshots[1];

    return {
      holders: {
        current: current.holders,
        previous: previous.holders,
        change: current.holders - previous.holders,
      },
      marketcap: {
        current: current.marketcap,
        previous: previous.marketcap,
        changePct: pctChange(previous.marketcap, current.marketcap),
      },
      volume24h: {
        current: current.volume_24h,
        previous: previous.volume_24h,
        changePct: pctChange(previous.volume_24h, current.volume_24h),
      },
      liquidity: {
        current: current.liquidity,
        previous: previous.liquidity,
        changePct: pctChange(previous.liquidity, current.liquidity),
      },
    };
  } catch {
    return null;
  }
}

async function fetchGithubSummary(githubRepo: string): Promise<string | null> {
  if (!githubRepo) return null;

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const [commitsRes, releasesRes] = await Promise.all([
      fetch(
        `https://api.github.com/repos/${githubRepo}/commits?per_page=100&since=${since}`,
        { headers }
      ),
      fetch(
        `https://api.github.com/repos/${githubRepo}/releases?per_page=1`,
        { headers }
      ),
    ]);

    const parts: string[] = [];

    if (commitsRes.ok) {
      const commits = await commitsRes.json();
      if (Array.isArray(commits) && commits.length > 0) {
        parts.push(`${commits.length} commits today`);
      }
    }

    if (releasesRes.ok) {
      const releases = await releasesRes.json();
      if (Array.isArray(releases) && releases.length > 0) {
        const latest = releases[0];
        const publishedAt = new Date(latest.published_at);
        const dayAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
        if (publishedAt > dayAgo) {
          parts.push(`${latest.tag_name} released`);
        }
      }
    }

    return parts.length > 0 ? parts.join(", ") : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Gemini analysis
// ---------------------------------------------------------------------------

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

function buildAnalysisPrompt(
  projectName: string,
  signal: { title: string; description: string },
  twitterHandle: string,
  tweets: string[],
  delta: OnchainDelta | null,
  githubActivity: string | null
): string {
  const tweetBlock =
    tweets.length > 0
      ? tweets.map((t, i) => `${i + 1}. ${t}`).join("\n")
      : "No recent tweets";

  let onchainBlock = "No on-chain data available";
  if (delta) {
    onchainBlock = [
      `- Market cap: $${formatNumber(delta.marketcap.previous)} → $${formatNumber(delta.marketcap.current)} (${delta.marketcap.changePct > 0 ? "+" : ""}${delta.marketcap.changePct}%)`,
      `- Volume: $${formatNumber(delta.volume24h.previous)} → $${formatNumber(delta.volume24h.current)} (${delta.volume24h.changePct > 0 ? "+" : ""}${delta.volume24h.changePct}%)`,
      `- Holders: ${formatNumber(delta.holders.previous)} → ${formatNumber(delta.holders.current)} (${delta.holders.change > 0 ? "+" : ""}${formatNumber(delta.holders.change)})`,
      `- Liquidity: $${formatNumber(delta.liquidity.previous)} → $${formatNumber(delta.liquidity.current)} (${delta.liquidity.changePct > 0 ? "+" : ""}${delta.liquidity.changePct}%)`,
    ].join("\n");
  }

  const githubBlock = githubActivity || "No GitHub URL configured";

  return `You are a crypto market analyst for the Base ecosystem. A signal was detected for ${projectName}:

Signal: ${signal.title}
${signal.description}

Recent tweets from @${twitterHandle || "unknown"}:
${tweetBlock}

On-chain changes (24h):
${onchainBlock}

GitHub activity:
${githubBlock}

Write a 2-3 sentence analysis explaining what's happening and why. Be specific with numbers. If you can identify a likely catalyst, mention it. Be concise and direct — no fluff.`;
}

async function generateAnalysis(prompt: string): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch(`${GEMINI_URL}?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!res.ok) {
      console.error(`[SignalContext] Gemini error ${res.status}`);
      return null;
    }

    const data = await res.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return text.trim() || null;
  } catch (err) {
    console.error("[SignalContext] Gemini analysis failed:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main enricher
// ---------------------------------------------------------------------------

export async function enrichSignal(
  signal: { type: string; title: string; description: string; project_id: string },
  projectName: string,
  twitterHandle: string,
  githubRepo: string
): Promise<SignalContext> {
  // Fetch all context in parallel
  const [recentTweets, onchainDelta, recentGithubActivity] = await Promise.all([
    fetchRecentTweets(twitterHandle),
    fetchOnchainDelta(signal.project_id),
    fetchGithubSummary(githubRepo),
  ]);

  // Generate AI analysis
  const prompt = buildAnalysisPrompt(
    projectName,
    signal,
    twitterHandle,
    recentTweets,
    onchainDelta,
    recentGithubActivity
  );

  const analysis = await generateAnalysis(prompt);

  return {
    signal,
    recentTweets,
    onchainDelta,
    recentGithubActivity,
    // Fall back to original description if Gemini fails
    analysis: analysis || signal.description,
  };
}

// ---------------------------------------------------------------------------
// Enriched notification formatter
// ---------------------------------------------------------------------------

export function formatEnrichedNotification(
  projectName: string,
  context: SignalContext
): string {
  const { signal, analysis, onchainDelta } = context;

  let statsLine = "";
  if (onchainDelta) {
    const mcap = `$${formatNumber(onchainDelta.marketcap.current)}`;
    const mcapChange = onchainDelta.marketcap.changePct;
    const mcapSign = mcapChange > 0 ? "+" : "";
    const vol = `$${formatNumber(onchainDelta.volume24h.current)}`;
    const holders = formatNumber(onchainDelta.holders.current);
    const holdersChange = onchainDelta.holders.change;
    const holdersSign = holdersChange > 0 ? "+" : "";

    statsLine = `\n📊 MCap: ${mcap} (${mcapSign}${mcapChange}%) | Vol: ${vol} | Holders: ${holders} (${holdersSign}${formatNumber(holdersChange)})`;
  }

  return (
    `🔔 <b>${projectName}</b>\n\n` +
    `${signal.title}\n\n` +
    `${analysis}` +
    (statsLine ? `\n${statsLine}` : "") +
    `\n\n→ sonarbot.vercel.app/project/${signal.project_id}`
  );
}
