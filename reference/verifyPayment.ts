interface PaymentVerificationResult {
  valid: boolean;
  from?: string;
  to?: string;
  amount?: string;
  usdValue?: string;
  error?: string;
}

const MINIMUM_USD = 9.5;

/**
 * Fetch current $SNR price in USD from DexScreener
 */
async function getSnrPriceUsd(): Promise<number> {
  const snrContract = '0xE1231f809124e4Aa556cD9d8c28CB33f02c75b07';
  const res = await fetch(
    `https://api.dexscreener.com/latest/dex/tokens/${snrContract}`,
    { next: { revalidate: 60 } } // cache for 60s
  );

  if (!res.ok) {
    throw new Error(`DexScreener API error: ${res.status}`);
  }

  const data = await res.json();
  const pair = data.pairs?.find(
    (p: any) =>
      p.baseToken?.address?.toLowerCase() === snrContract.toLowerCase() &&
      p.priceUsd
  );

  if (!pair?.priceUsd) {
    throw new Error('Could not fetch $SNR price from DexScreener');
  }

  return parseFloat(pair.priceUsd);
}

/**
 * Verify $SNR payment on Base network
 * @param txHash Transaction hash to verify
 * @returns Payment verification result
 */
export async function verifyPayment(txHash: string): Promise<PaymentVerificationResult> {
  try {
    // Base RPC endpoint
    const baseRpcUrl = 'https://mainnet.base.org';
    
    // $SNR token contract address on Base
    const snrTokenContract = '0xE1231f809124e4Aa556cD9d8c28CB33f02c75b07';
    
    // ERC-20 Transfer event topic
    const transferEventTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
    
    // Get payment address from environment (trim any whitespace/newlines)
    const paymentAddress = process.env.SNR_PAYMENT_ADDRESS?.trim();
    if (!paymentAddress) {
      throw new Error('SNR_PAYMENT_ADDRESS not configured');
    }
    
    // Get transaction receipt
    const response = await fetch(baseRpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getTransactionReceipt',
        params: [txHash],
        id: 1,
      }),
    });
    
    const data = await response.json();
    
    if (data.error) {
      return {
        valid: false,
        error: `RPC error: ${data.error.message}`,
      };
    }
    
    const receipt = data.result;
    
    if (!receipt) {
      return {
        valid: false,
        error: 'Transaction not found or not mined',
      };
    }
    
    // Check if transaction was successful
    if (receipt.status !== '0x1') {
      return {
        valid: false,
        error: 'Transaction failed',
      };
    }
    
    // Find Transfer event in logs
    const transferLog = receipt.logs.find((log: any) => {
      return (
        log.topics[0] === transferEventTopic &&
        log.address.toLowerCase() === snrTokenContract.toLowerCase()
      );
    });
    
    if (!transferLog) {
      return {
        valid: false,
        error: 'No $SNR Transfer event found in transaction',
      };
    }
    
    // Decode Transfer event: Transfer(from, to, amount)
    // topics[1] = from (padded to 32 bytes)
    // topics[2] = to (padded to 32 bytes)  
    // data = amount (32 bytes)
    
    if (transferLog.topics.length < 3) {
      return {
        valid: false,
        error: 'Invalid Transfer event format',
      };
    }
    
    const fromAddress = '0x' + transferLog.topics[1].slice(-40); // Last 40 chars (20 bytes)
    const toAddress = '0x' + transferLog.topics[2].slice(-40);
    const amountHex = transferLog.data;
    
    // Convert amount from hex to decimal (18 decimals)
    const amountWei = BigInt(amountHex);
    const amountTokens = Number(amountWei) / Math.pow(10, 18);
    
    // Verify recipient is our payment address
    if (toAddress.toLowerCase() !== paymentAddress.toLowerCase()) {
      return {
        valid: false,
        error: `Payment sent to wrong address. Expected: ${paymentAddress}, Got: ${toAddress}`,
      };
    }
    
    // Sanity check: amount must be positive
    if (amountTokens <= 0) {
      return {
        valid: false,
        error: `Invalid payment amount: ${amountTokens.toFixed(2)} $SNR`,
      };
    }

    // Fetch live $SNR price and verify USD value >= $9.50
    let priceUsd: number;
    try {
      priceUsd = await getSnrPriceUsd();
    } catch (priceError) {
      return {
        valid: false,
        error: `Could not verify $SNR price: ${priceError instanceof Error ? priceError.message : 'Unknown error'}`,
      };
    }

    const usdValue = amountTokens * priceUsd;

    if (usdValue < MINIMUM_USD) {
      return {
        valid: false,
        error: `Insufficient payment. Sent ${amountTokens.toFixed(2)} $SNR (~$${usdValue.toFixed(2)}). Minimum required: $${MINIMUM_USD.toFixed(2)} (at current price $${priceUsd.toFixed(8)}/SNR, send at least ${Math.ceil(MINIMUM_USD / priceUsd).toLocaleString()} $SNR)`,
      };
    }
    
    return {
      valid: true,
      from: fromAddress,
      to: toAddress,
      amount: amountTokens.toFixed(2),
      usdValue: usdValue.toFixed(2),
    };
    
  } catch (error) {
    console.error('Payment verification error:', error);
    return {
      valid: false,
      error: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
