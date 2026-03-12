"use client";

import { pay, getPaymentStatus } from "@base-org/account";

export const PRO_PRICE_USDC = "9.99";

const PAYMENT_WALLET: `0x${string}` =
  (process.env.NEXT_PUBLIC_PAYMENT_WALLET as `0x${string}`) ||
  "0xE3aC289bC25404A2c66A02459aB99dcD746E52b2";

export async function payWithBase() {
  const payment = await pay({
    amount: PRO_PRICE_USDC,
    to: PAYMENT_WALLET,
    testnet: false,
  });
  return payment;
}

export { getPaymentStatus };
