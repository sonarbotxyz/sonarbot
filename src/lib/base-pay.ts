import { pay, getPaymentStatus } from "@base-org/account";

export const PRO_PRICE_USDC = "9.99";

export const PAYMENT_WALLET =
  process.env.NEXT_PUBLIC_PAYMENT_WALLET || "0x0000000000000000000000000000000000000000";

export async function payWithBase() {
  const payment = await pay({
    amount: PRO_PRICE_USDC,
    to: PAYMENT_WALLET as `0x${string}`,
    testnet: false,
  });
  return payment;
}

export { getPaymentStatus };
