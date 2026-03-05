/**
 * X (Twitter) Signal Pipeline
 *
 * Fetches recent tweets from tracked projects, classifies them with Gemini,
 * and inserts new signals into the database.
 */

import { getSupabase } from "@/lib/supabase";
import { classifyContent } from "./signal-classifier";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface XTweet {
  id: string;
  text: string;
  created_at: string;
  public_metrics: {
    like_count: number;
    retweet_count: number;
    reply_count: number;
    quote_count: number;
  };
  referenced_tweets?: Array<{ type: string; id: string }>;
}

interface XSearchResponse {
  data?: XTweet[];
  meta?: { result_count: number };
}

interface ProjectForX {
  id: string;
  name: string;
  twitter_handle: string;
}

interface XPipelineResult {
  projectId: string;
  projectName: string;
  tweetsChecked: number;
  signalsCreated: number;
  errors: string[];
}

// ---------------------------------------------------------------------------
// X API
// ---------------------------------------------------------------------------

const X_API_BASE = "https://api.twitter.com/2";

function getXBearerToken(): string {
  const token = process.env.X_BEARER_TOKEN;
  if (!token) throw new Error("X_BEARER_TOKEN environment variable is not set");
  return token;
}

async function searchRecentTweets(handle: string): Promise<XTweet[]> {
  const query = encodeURIComponent(`from:${handle}`);
  const url = `${X_API_BASE}/tweets/search/recent?query=${query}&max_results=10&tweet.fields=created_at,public_metrics,referenced_tweets`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${getXBearerToken()}` },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`X API error ${res.status}: ${body}`);
  }

  const data: XSearchResponse = await res.json();
  return data.data ?? [];
}

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------

async function getLastCheckTime(
  projectId: string
): Promise<Date | null> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("signals")
    .select("detected_at")
    .eq("project_id", projectId)
    .eq("source", "x")
    .order("detected_at", { ascending: false })
    .limit(1);

  if (data && data.length > 0) {
    return new Date(data[0].detected_at);
  }
  return null;
}

function isReplyOrPureRT(tweet: XTweet): boolean {
  if (!tweet.referenced_tweets) return false;
  return tweet.referenced_tweets.some(
    (ref) => ref.type === "replied_to" || ref.type === "retweeted"
  );
}

async function processProject(
  project: ProjectForX
): Promise<XPipelineResult> {
  const result: XPipelineResult = {
    projectId: project.id,
    projectName: project.name,
    tweetsChecked: 0,
    signalsCreated: 0,
    errors: [],
  };

  try {
    const supabase = getSupabase();
    const lastCheck = await getLastCheckTime(project.id);
    const tweets = await searchRecentTweets(project.twitter_handle);
    result.tweetsChecked = tweets.length;

    for (const tweet of tweets) {
      try {
        // Skip replies and pure RTs
        if (isReplyOrPureRT(tweet)) continue;

        // Skip tweets older than last check
        if (lastCheck && new Date(tweet.created_at) <= lastCheck) continue;

        // Dedup: check if source_url already exists
        const sourceUrl = `https://x.com/${project.twitter_handle}/status/${tweet.id}`;
        const { data: existing } = await supabase
          .from("signals")
          .select("id")
          .eq("source_url", sourceUrl)
          .limit(1);

        if (existing && existing.length > 0) continue;

        // Classify with Gemini
        const classification = await classifyContent(project.name, tweet.text);
        if (!classification) continue;
        if (classification.confidence === "low") continue;

        // Insert signal
        const { error: insertError } = await supabase.from("signals").insert({
          project_id: project.id,
          type: classification.type,
          title: classification.title,
          description: classification.description,
          source: "x",
          source_url: sourceUrl,
          confidence: classification.confidence,
          detected_at: tweet.created_at,
        });

        if (insertError) {
          result.errors.push(`Insert error: ${insertError.message}`);
        } else {
          result.signalsCreated++;
        }
      } catch (tweetErr) {
        result.errors.push(
          `Tweet ${tweet.id}: ${tweetErr instanceof Error ? tweetErr.message : String(tweetErr)}`
        );
      }
    }
  } catch (err) {
    result.errors.push(
      err instanceof Error ? err.message : String(err)
    );
  }

  return result;
}

/**
 * Run the X signal pipeline for all projects with a twitter_handle.
 */
export async function runXSignalPipeline(): Promise<{
  results: XPipelineResult[];
  totalSignals: number;
}> {
  const supabase = getSupabase();
  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, name, twitter_handle")
    .eq("is_approved", true)
    .not("twitter_handle", "is", null)
    .neq("twitter_handle", "");

  if (error) {
    throw new Error(`Failed to fetch projects: ${error.message}`);
  }

  if (!projects || projects.length === 0) {
    return { results: [], totalSignals: 0 };
  }

  const results: XPipelineResult[] = [];
  for (const project of projects as ProjectForX[]) {
    const r = await processProject(project);
    results.push(r);
  }

  return {
    results,
    totalSignals: results.reduce((sum, r) => sum + r.signalsCreated, 0),
  };
}
