/**
 * Fetch token holder count via Etherscan V2 API (unified multichain).
 * Uses chainid=8453 for Base. Single API key works across all chains.
 * Falls back to 0 if unavailable.
 */
export async function fetchHolderCount(contractAddress: string): Promise<number> {
  const apiKey = process.env.ETHERSCAN_API_KEY;
  if (!apiKey) return 0;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(
      `https://api.etherscan.io/v2/api?chainid=8453&module=token&action=tokenholdercount&contractaddress=${contractAddress}&apikey=${apiKey}`,
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
