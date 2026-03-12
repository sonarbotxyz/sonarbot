"use client";

export const PRO_PRICE_USDC = "9.99";

// Hardcoded — USDC receiving wallet on Base
const PAYMENT_WALLET = "0xE3aC289bC25404A2c66A02459aB99dcD746E52b2" as const;

export async function payWithBase() {
  const { pay } = await import("@base-org/account");
  const payment = await pay({
    amount: PRO_PRICE_USDC,
    to: PAYMENT_WALLET,
    testnet: false,
  });
  return payment;
}

export async function checkPaymentStatus(paymentId: string) {
  const { getPaymentStatus } = await import("@base-org/account");
  return getPaymentStatus({ id: paymentId, testnet: false });
}
