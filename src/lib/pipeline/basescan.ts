/**
 * Fetch token holder count for Base chain tokens.
 *
 * Strategy:
 * 1. Try DexScreener pairs API (includes holder data for some tokens)
 * 2. Try Moralis API if MORALIS_API_KEY is set
 * 3. Fall back to previous snapshot value via callback
 *
 * Etherscan V2 free plan does NOT support Base chain for this endpoint.
 * Basescan V1 API is deprecated.
 */
export async function fetchHolderCount(
  contractAddress: string,
  previousHolders?: number
): Promise<number> {
  // Strategy 1: Try Moralis free tier
  const moralisKey = process.env.MORALIS_API_KEY;
  if (moralisKey) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(
        `https://deep-index.moralis.io/api/v2.2/erc20/${contractAddress}/owners?chain=base`,
        {
          headers: {
            "X-API-Key": moralisKey,
            Accept: "application/json",
          },
          signal: controller.signal,
        }
      );
      clearTimeout(timeout);

      if (res.ok) {
        const json = await res.json();
        // Moralis returns { total: number } for holder count
        if (json.total && json.total > 0) {
          return json.total;
        }
      }
    } catch {
      // Fall through to next strategy
    }
  }

  // Strategy 2: Try Etherscan V2 (works on paid plans)
  const etherscanKey = process.env.ETHERSCAN_API_KEY;
  if (etherscanKey) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(
        `https://api.etherscan.io/v2/api?chainid=8453&module=token&action=tokenholdercount&contractaddress=${contractAddress}&apikey=${etherscanKey}`,
        { signal: controller.signal }
      );
      clearTimeout(timeout);

      if (res.ok) {
        const json = await res.json();
        if (json.status === "1" && json.result) {
          return parseInt(json.result, 10) || 0;
        }
      }
    } catch {
      // Fall through
    }
  }

  // Strategy 3: Keep previous value if available
  return previousHolders ?? 0;
}
