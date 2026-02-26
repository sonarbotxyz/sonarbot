interface SpotPaymentVerificationResult {
  valid: boolean;
  from?: string;
  to?: string;
  amount?: string;
  usdValue?: string;
  error?: string;
}

// USDC on Base (6 decimals)
const USDC_CONTRACT = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
// $SNR on Base (18 decimals)
const SNR_CONTRACT = '0xE1231f809124e4Aa556cD9d8c28CB33f02c75b07';

// ERC-20 Transfer event topic
const TRANSFER_EVENT_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

function getPaymentAddress(): string {
  const addr = (process.env.SPONSORED_PAYMENT_ADDRESS || process.env.SNR_PAYMENT_ADDRESS)?.trim();
  if (!addr) throw new Error('SPONSORED_PAYMENT_ADDRESS not configured');
  return addr;
}

/**
 * Fetch current $SNR price in USD from DexScreener
 */
async function getSnrPriceUsd(): Promise<number> {
  const res = await fetch(
    `https://api.dexscreener.com/latest/dex/tokens/${SNR_CONTRACT}`
  );

  if (!res.ok) {
    throw new Error(`DexScreener API error: ${res.status}`);
  }

  const data = await res.json();
  const pair = data.pairs?.find(
    (p: any) =>
      p.baseToken?.address?.toLowerCase() === SNR_CONTRACT.toLowerCase() &&
      p.priceUsd
  );

  if (!pair?.priceUsd) {
    throw new Error('Could not fetch $SNR price from DexScreener');
  }

  return parseFloat(pair.priceUsd);
}

/**
 * Verify sponsored spot payment on Base network.
 * For USDC: verifies amount matches expected (with small tolerance).
 * For SNR: fetches live price, verifies USD value covers at least 95% of expected amount.
 */
export async function verifySpotPayment(
  txHash: string,
  paymentToken: 'USDC' | 'SNR',
  expectedAmountUsd: number
): Promise<SpotPaymentVerificationResult> {
  try {
    const baseRpcUrl = 'https://mainnet.base.org';
    const paymentAddress = getPaymentAddress();

    const tokenContract = paymentToken === 'USDC' ? USDC_CONTRACT : SNR_CONTRACT;
    const decimals = paymentToken === 'USDC' ? 6 : 18;

    // Get transaction receipt
    const response = await fetch(baseRpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getTransactionReceipt',
        params: [txHash],
        id: 1,
      }),
    });

    const data = await response.json();

    if (data.error) {
      return { valid: false, error: `RPC error: ${data.error.message}` };
    }

    const receipt = data.result;
    if (!receipt) {
      return { valid: false, error: 'Transaction not found or not mined' };
    }

    if (receipt.status !== '0x1') {
      return { valid: false, error: 'Transaction failed' };
    }

    // Find Transfer event for the right token contract
    const transferLog = receipt.logs.find((log: { address: string; topics: string[] }) => {
      return (
        log.topics[0] === TRANSFER_EVENT_TOPIC &&
        log.address.toLowerCase() === tokenContract.toLowerCase()
      );
    });

    if (!transferLog) {
      return { valid: false, error: `No ${paymentToken} Transfer event found in transaction` };
    }

    if (transferLog.topics.length < 3) {
      return { valid: false, error: 'Invalid Transfer event format' };
    }

    const fromAddress = '0x' + transferLog.topics[1].slice(-40);
    const toAddress = '0x' + transferLog.topics[2].slice(-40);
    const amountHex = transferLog.data;
    const amountWei = BigInt(amountHex);
    const amountTokens = Number(amountWei) / Math.pow(10, decimals);

    // Verify recipient
    if (toAddress.toLowerCase() !== paymentAddress.toLowerCase()) {
      return {
        valid: false,
        error: `Payment sent to wrong address. Expected: ${paymentAddress}, Got: ${toAddress}`,
      };
    }

    if (amountTokens <= 0) {
      return { valid: false, error: `${paymentToken} transfer amount must be greater than 0` };
    }

    if (paymentToken === 'USDC') {
      // For USDC: verify amount matches expected (allow small rounding tolerance)
      if (Math.abs(amountTokens - expectedAmountUsd) > 0.50) {
        return {
          valid: false,
          error: `Incorrect USDC amount. Expected: $${expectedAmountUsd.toFixed(2)}, Got: $${amountTokens.toFixed(2)}`,
        };
      }

      return {
        valid: true,
        from: fromAddress,
        to: toAddress,
        amount: amountTokens.toFixed(2),
        usdValue: amountTokens.toFixed(2),
      };
    } else {
      // For SNR: fetch live price and verify USD value covers the expected amount
      let snrPrice: number;
      try {
        snrPrice = await getSnrPriceUsd();
      } catch (priceError) {
        return {
          valid: false,
          error: `Could not verify $SNR price: ${priceError instanceof Error ? priceError.message : 'Unknown error'}`,
        };
      }

      const usdValue = amountTokens * snrPrice;
      // Allow 5% slippage tolerance
      const minimumUsd = expectedAmountUsd * 0.95;

      if (usdValue < minimumUsd) {
        const requiredSnr = Math.ceil(expectedAmountUsd / snrPrice);
        return {
          valid: false,
          error: `Insufficient $SNR payment. Sent ${amountTokens.toFixed(2)} $SNR (~$${usdValue.toFixed(2)}). Required: ~$${expectedAmountUsd.toFixed(2)} (at $${snrPrice.toFixed(8)}/SNR, send at least ${requiredSnr.toLocaleString()} $SNR)`,
        };
      }

      return {
        valid: true,
        from: fromAddress,
        to: toAddress,
        amount: amountTokens.toFixed(2),
        usdValue: usdValue.toFixed(2),
      };
    }
  } catch (error) {
    console.error('Spot payment verification error:', error);
    return {
      valid: false,
      error: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export { USDC_CONTRACT, SNR_CONTRACT };
