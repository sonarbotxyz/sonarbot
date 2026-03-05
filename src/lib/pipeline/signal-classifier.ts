/**
 * Signal Classifier — Gemini AI
 *
 * Classifies crypto project content into signal categories using
 * Google Gemini 2.0 Flash.
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
// Gemini API
// ---------------------------------------------------------------------------

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

function getGeminiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY environment variable is not set");
  return key;
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

/**
 * Classify a single piece of content using Gemini.
 * Returns null if classification fails (non-fatal).
 */
export async function classifyContent(
  projectName: string,
  content: string
): Promise<ClassificationResult | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(`${GEMINI_URL}?key=${getGeminiKey()}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(projectName, content) }] }],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.status === 429) {
      // Rate limited — wait 15s and retry once
      console.error("[Classifier] Gemini rate limited, retrying in 15s...");
      await new Promise((r) => setTimeout(r, 15000));
      const retryController = new AbortController();
      const retryTimeout = setTimeout(() => retryController.abort(), 10000);
      const retry = await fetch(`${GEMINI_URL}?key=${getGeminiKey()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: buildPrompt(projectName, content) }] }],
        }),
        signal: retryController.signal,
      });
      clearTimeout(retryTimeout);
      if (!retry.ok) {
        console.error(`Gemini retry failed: ${retry.status}`);
        return null;
      }
      const retryData = await retry.json();
      const retryText: string = retryData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      const retryMatch = retryText.match(/\{[\s\S]*\}/);
      if (!retryMatch) return null;
      const retryParsed = JSON.parse(retryMatch[0]);
      if (!VALID_TYPES.has(retryParsed.type)) retryParsed.type = "all_updates";
      if (!VALID_CONFIDENCE.has(retryParsed.confidence)) retryParsed.confidence = "medium";
      if (typeof retryParsed.title !== "string" || !retryParsed.title) return null;
      return {
        type: retryParsed.type,
        title: retryParsed.title.slice(0, 100),
        description: typeof retryParsed.description === "string" ? retryParsed.description : "",
        confidence: retryParsed.confidence,
      };
    }

    if (!res.ok) {
      console.error(`Gemini API error ${res.status}: ${await res.text()}`);
      return null;
    }

    const data = await res.json();
    const rawText: string =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // Extract JSON from response (may be wrapped in markdown code fences)
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Gemini returned no parseable JSON:", rawText);
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
      description:
        typeof parsed.description === "string" ? parsed.description : "",
      confidence: parsed.confidence,
    };
  } catch (err) {
    console.error("Gemini classification error:", err);
    return null;
  }
}

/** Delay helper to respect Gemini rate limits (15 req/min) */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Classify multiple items in sequence with throttling.
 * 4-second delay between calls = max 15 req/min (Gemini free tier limit).
 */
export async function classifyBatch(
  projectName: string,
  items: string[]
): Promise<(ClassificationResult | null)[]> {
  const results: (ClassificationResult | null)[] = [];
  for (let i = 0; i < items.length; i++) {
    if (i > 0) await delay(4000); // 4s between calls
    results.push(await classifyContent(projectName, items[i]));
  }
  return results;
}
