/**
 * Fetch token holder count from Basescan API.
 * Uses the tokenholdercount endpoint (free, needs API key).
 * Falls back to 0 if unavailable.
 */
export async function fetchHolderCount(contractAddress: string): Promise<number> {
  const apiKey = process.env.BASESCAN_API_KEY;
  if (!apiKey) return 0;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(
      `https://api.basescan.org/api?module=token&action=tokenholdercount&contractaddress=${contractAddress}&apikey=${apiKey}`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!res.ok) return 0;
    const json = await res.json();

    if (json.status === "1" && json.result) {
      return parseInt(json.result, 10) || 0;
    }
    return 0;
  } catch {
    clearTimeout(timeout);
    return 0;
  }
}
