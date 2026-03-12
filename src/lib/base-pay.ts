import { pay, getPaymentStatus } from "@base-org/account";
import { isAddress } from "viem";

export const PRO_PRICE_USDC = "9.99";

export function getPaymentWallet(): `0x${string}` {
  const wallet = process.env.NEXT_PUBLIC_PAYMENT_WALLET;
  if (!wallet || !isAddress(wallet)) {
    throw new Error("Invalid or missing NEXT_PUBLIC_PAYMENT_WALLET");
  }
  return wallet;
}

export async function payWithBase() {
  const payment = await pay({
    amount: PRO_PRICE_USDC,
    to: getPaymentWallet(),
    testnet: false,
  });
  return payment;
}

export { getPaymentStatus };
