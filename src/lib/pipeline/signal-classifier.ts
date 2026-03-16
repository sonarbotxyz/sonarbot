/**
 * Signal Classifier — Gemini via OpenRouter
 *
 * Classifies crypto project content into signal categories using
 * Google Gemini 2.0 Flash through OpenRouter API.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ClassificationResult {
  type:
    | "metrics_milestones"
    | "new_features_launches"
    | "partnerships_integrations"
    | "all_updates"
    | "token_events";
  title: string;
  description: string;
  confidence: "high" | "medium" | "low";
}

const VALID_TYPES = new Set([
  "metrics_milestones",
  "new_features_launches",
  "partnerships_integrations",
  "all_updates",
  "token_events",
]);

const VALID_CONFIDENCE = new Set(["high", "medium", "low"]);

// ---------------------------------------------------------------------------
// OpenRouter API
// ---------------------------------------------------------------------------

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "google/gemini-2.0-flash-001";

function getOpenRouterKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY environment variable is not set");
  return key;
}

function buildHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getOpenRouterKey()}`,
    "HTTP-Referer": "https://sonarbot.vercel.app",
    "X-Title": "Sonarbot Signal Classifier",
  };
}

function buildPrompt(projectName: string, content: string): string {
  return `You are a crypto project signal classifier. Classify this content from ${projectName} into exactly ONE category:

- metrics_milestones: TVL, holder count, volume crossing thresholds, ATH, growth milestones
- new_features_launches: Product updates, new versions, feature releases, deployments
- partnerships_integrations: New partners, collaborations, chain expansions, integrations
- token_events: Listings, liquidity events, tokenomics changes, burns, airdrops
- all_updates: General news, team updates, community posts, anything else

Content: ${content}

Respond with JSON only:
{"type": "...", "title": "...", "description": "...", "confidence": "high|medium|low"}`;
}

function buildRequestBody(projectName: string, content: string): string {
  return JSON.stringify({
    model: MODEL,
    messages: [
      {
        role: "user",
        content: buildPrompt(projectName, content),
      },
    ],
  });
}

/**
 * Parse OpenRouter response into ClassificationResult.
 */
function parseResponse(data: Record<string, unknown>): ClassificationResult | null {
  const rawText: string =
    (data?.choices as Array<{ message?: { content?: string } }>)?.[0]?.message?.content ?? "";

  // Extract JSON from response (may be wrapped in markdown code fences)
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error("[Classifier] No parseable JSON in response:", rawText);
    return null;
  }

  const parsed = JSON.parse(jsonMatch[0]);

  // Validate fields
  if (!VALID_TYPES.has(parsed.type)) {
    parsed.type = "all_updates";
  }
  if (!VALID_CONFIDENCE.has(parsed.confidence)) {
    parsed.confidence = "medium";
  }
  if (typeof parsed.title !== "string" || !parsed.title) {
    return null;
  }

  return {
    type: parsed.type,
    title: parsed.title.slice(0, 100),
    description: typeof parsed.description === "string" ? parsed.description : "",
    confidence: parsed.confidence,
  };
}

/**
 * Classify a single piece of content using Gemini via OpenRouter.
 * Returns null if classification fails (non-fatal).
 */
export async function classifyContent(
  projectName: string,
  content: string
): Promise<ClassificationResult | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: buildHeaders(),
      body: buildRequestBody(projectName, content),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.status === 429) {
      // Rate limited — wait 10s and retry once
      console.error("[Classifier] OpenRouter rate limited, retrying in 10s...");
      await new Promise((r) => setTimeout(r, 10000));
      const retryController = new AbortController();
      const retryTimeout = setTimeout(() => retryController.abort(), 15000);
      const retry = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: buildHeaders(),
        body: buildRequestBody(projectName, content),
        signal: retryController.signal,
      });
      clearTimeout(retryTimeout);
      if (!retry.ok) {
        console.error(`[Classifier] OpenRouter retry failed: ${retry.status}`);
        return null;
      }
      return parseResponse(await retry.json());
    }

    if (!res.ok) {
      console.error(`[Classifier] OpenRouter API error ${res.status}: ${await res.text()}`);
      return null;
    }

    return parseResponse(await res.json());
  } catch (err) {
    console.error("[Classifier] Classification error:", err);
    return null;
  }
}

/** Delay helper */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Classify multiple items in sequence with throttling.
 * 1-second delay between calls (OpenRouter has better rate limits than free Gemini).
 */
export async function classifyBatch(
  projectName: string,
  items: string[]
): Promise<(ClassificationResult | null)[]> {
  const results: (ClassificationResult | null)[] = [];
  for (let i = 0; i < items.length; i++) {
    if (i > 0) await delay(1000);
    results.push(await classifyContent(projectName, items[i]));
  }
  return results;
}
