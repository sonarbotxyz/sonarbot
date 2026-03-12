const SNR_CONTRACT = "0xE1231f809124e4Aa556cD9d8c28CB33f02c75b07";
const DEXSCREENER_API = `https://api.dexscreener.com/latest/dex/tokens/${SNR_CONTRACT}`;

// Cache price for 5 minutes to avoid hammering the API
let cachedPrice: { usd: number; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

export const SNR_PRO_USD = 7.49; // 25% off $9.99

export async function getSNRPrice(): Promise<number> {
  if (cachedPrice && Date.now() - cachedPrice.timestamp < CACHE_TTL) {
    return cachedPrice.usd;
  }

  try {
    const res = await fetch(DEXSCREENER_API, { next: { revalidate: 300 } });
    const data = await res.json();
    const pair = data?.pairs?.[0];
    const priceUsd = parseFloat(pair?.priceUsd);

    if (!priceUsd || isNaN(priceUsd)) {
      throw new Error("Invalid price data");
    }

    cachedPrice = { usd: priceUsd, timestamp: Date.now() };
    return priceUsd;
  } catch {
    // Fallback to cached price if available, otherwise throw
    if (cachedPrice) return cachedPrice.usd;
    throw new Error("Failed to fetch SNR price");
  }
}

export async function getSNRAmount(): Promise<{
  amount: number;
  priceUsd: number;
  totalUsd: number;
}> {
  const priceUsd = await getSNRPrice();
  const amount = Math.ceil(SNR_PRO_USD / priceUsd);
  return { amount, priceUsd, totalUsd: SNR_PRO_USD };
}

export function formatSNRAmount(amount: number): string {
  if (amount >= 1_000_000) {
    const m = amount / 1_000_000;
    return m % 1 === 0 ? `${m}M` : `${m.toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    const k = amount / 1_000;
    return k % 1 === 0 ? `${k}K` : `${k.toFixed(1)}K`;
  }
  return amount.toLocaleString();
}

/** Convert token amount to raw 18-decimal BigInt */
export function toRawAmount(amount: number): bigint {
  return BigInt(amount) * BigInt(10) ** BigInt(18);
}
