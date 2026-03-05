/**
 * X (Twitter) API Integration
 *
 * Fetches follower counts and engagement rates from the X API v2.
 * Uses Bearer token authentication (pay-per-use credit model).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface XUserProfile {
  followers: number;
  following: number;
  tweetCount: number;
}

interface XPublicMetrics {
  followers_count: number;
  following_count: number;
  tweet_count: number;
  listed_count: number;
}

interface XTweetMetrics {
  like_count: number;
  retweet_count: number;
  reply_count: number;
  quote_count: number;
  impression_count?: number;
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

const X_API_BASE = "https://api.x.com/2";

function getXBearerToken(): string {
  const token = process.env.X_BEARER_TOKEN;
  if (!token) {
    throw new Error("X_BEARER_TOKEN environment variable is not set");
  }
  return token;
}

async function xApiFetch<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  const res = await fetch(`${X_API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${getXBearerToken()}`,
    },
    signal: controller.signal,
  });
  clearTimeout(timeout);

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`X API error ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Data fetchers
// ---------------------------------------------------------------------------

/**
 * Fetch a user's profile metrics from X.
 * GET /2/users/:id?user.fields=public_metrics
 */
export async function fetchXUserProfile(
  xUserId: string
): Promise<XUserProfile> {
  const response = await xApiFetch<{
    data: { public_metrics: XPublicMetrics };
  }>(`/users/${xUserId}?user.fields=public_metrics`);

  const metrics = response.data.public_metrics;

  return {
    followers: metrics.followers_count,
    following: metrics.following_count,
    tweetCount: metrics.tweet_count,
  };
}

/**
 * Calculate engagement rate from a user's recent tweets.
 * GET /2/users/:id/tweets?max_results=10&tweet.fields=public_metrics
 *
 * Engagement rate = avg(likes + retweets + replies) / followers * 100
 * Returns percentage (e.g., 2.5 means 2.5%).
 */
export async function fetchXEngagementRate(
  xUserId: string
): Promise<number> {
  // First get follower count
  const profile = await fetchXUserProfile(xUserId);

  if (profile.followers <= 0) {
    return 0;
  }

  const response = await xApiFetch<{
    data?: Array<{ public_metrics: XTweetMetrics }>;
  }>(
    `/users/${xUserId}/tweets?max_results=50&tweet.fields=public_metrics`
  );

  const tweets = response.data;
  if (!tweets || tweets.length === 0) {
    return 0;
  }

  // Calculate engagement including quote_count
  let totalEngagement = 0;
  let totalImpressions = 0;
  let hasImpressions = false;

  for (const tweet of tweets) {
    const m = tweet.public_metrics;
    totalEngagement += m.like_count + m.retweet_count + m.reply_count + m.quote_count;
    if (m.impression_count && m.impression_count > 0) {
      totalImpressions += m.impression_count;
      hasImpressions = true;
    }
  }

  // Prefer impression-based engagement if available
  let engagementRate: number;
  if (hasImpressions && totalImpressions > 0) {
    engagementRate = (totalEngagement / totalImpressions) * 100;
  } else {
    const avgEngagement = totalEngagement / tweets.length;
    engagementRate = (avgEngagement / profile.followers) * 100;
  }

  return Math.round(engagementRate * 100) / 100;
}

/**
 * Fetch combined X data for a project.
 * Returns follower count and engagement rate.
 */
export async function fetchXData(
  xUserId: string
): Promise<{ followers: number; engagementRate: number }> {
  // Fetch tweets (which includes a profile lookup for engagement calc)
  const response = await xApiFetch<{
    data?: Array<{ public_metrics: XTweetMetrics }>;
  }>(
    `/users/${xUserId}/tweets?max_results=50&tweet.fields=public_metrics`
  );

  const profile = await xApiFetch<{
    data: { public_metrics: XPublicMetrics };
  }>(`/users/${xUserId}?user.fields=public_metrics`);

  const followers = profile.data.public_metrics.followers_count;

  if (followers <= 0) {
    return { followers, engagementRate: 0 };
  }

  const tweets = response.data;
  if (!tweets || tweets.length === 0) {
    return { followers, engagementRate: 0 };
  }

  let totalEngagement = 0;
  let totalImpressions = 0;
  let hasImpressions = false;

  for (const tweet of tweets) {
    const m = tweet.public_metrics;
    totalEngagement += m.like_count + m.retweet_count + m.reply_count + m.quote_count;
    if (m.impression_count && m.impression_count > 0) {
      totalImpressions += m.impression_count;
      hasImpressions = true;
    }
  }

  let engagementRate: number;
  if (hasImpressions && totalImpressions > 0) {
    engagementRate = Math.round(((totalEngagement / totalImpressions) * 100) * 100) / 100;
  } else {
    const avgEngagement = totalEngagement / tweets.length;
    engagementRate = Math.round(((avgEngagement / followers) * 100) * 100) / 100;
  }

  return { followers, engagementRate };
}
