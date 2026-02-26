import { getSupabase } from './db';

/**
 * Check if a tx_hash has already been used for ANY payment (subscription or sponsored).
 * Returns null if unused, or a description of where it was used.
 */
export async function checkTxAlreadyUsed(txHash: string): Promise<string | null> {
  const supabase = getSupabase();

  // Check subscription_payments
  const { data: subPayment } = await supabase
    .from('subscription_payments')
    .select('id, status')
    .eq('tx_hash', txHash)
    .single();

  if (subPayment) {
    return `Transaction already used for subscription payment (status: ${subPayment.status})`;
  }

  // Check sponsored_spots
  const { data: sponsoredSpot } = await supabase
    .from('sponsored_spots')
    .select('id, status')
    .eq('tx_hash', txHash)
    .single();

  if (sponsoredSpot) {
    return `Transaction already used for sponsored spot (status: ${sponsoredSpot.status})`;
  }

  return null;
}

/**
 * Get the block timestamp of a transaction.
 * Returns Unix timestamp in seconds, or null if not found.
 */
export async function getTxTimestamp(txHash: string): Promise<number | null> {
  const baseRpcUrl = 'https://mainnet.base.org';

  // Get transaction to find block number
  const txRes = await fetch(baseRpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_getTransactionByHash',
      params: [txHash],
      id: 1,
    }),
  });
  const txData = await txRes.json();
  const blockNumber = txData.result?.blockNumber;
  if (!blockNumber) return null;

  // Get block to find timestamp
  const blockRes = await fetch(baseRpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_getBlockByNumber',
      params: [blockNumber, false],
      id: 2,
    }),
  });
  const blockData = await blockRes.json();
  const timestampHex = blockData.result?.timestamp;
  if (!timestampHex) return null;

  return parseInt(timestampHex, 16);
}

/**
 * Verify that a transaction was mined within a time window.
 * @param txHash Transaction hash
 * @param maxAgeSeconds Maximum age of the transaction in seconds (default: 10 minutes)
 */
export async function verifyTxFreshness(txHash: string, maxAgeSeconds: number = 600): Promise<{ fresh: boolean; ageSeconds?: number; error?: string }> {
  const timestamp = await getTxTimestamp(txHash);
  if (timestamp === null) {
    return { fresh: false, error: 'Could not determine transaction timestamp' };
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const ageSeconds = nowSeconds - timestamp;

  if (ageSeconds > maxAgeSeconds) {
    const ageMinutes = Math.floor(ageSeconds / 60);
    return {
      fresh: false,
      ageSeconds,
      error: `Transaction is too old (${ageMinutes} minutes ago). Payment must be made within ${Math.floor(maxAgeSeconds / 60)} minutes of booking.`,
    };
  }

  return { fresh: true, ageSeconds };
}
