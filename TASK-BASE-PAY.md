# TASK: Replace Stripe with Base Pay

## Goal
Replace Stripe payment integration with Base Pay (USDC payments via `@base-org/account` SDK). Keep the existing SNR token payment option as-is.

## Base Pay Docs
- Main guide: https://docs.base.org/base-account/guides/accept-payments
- SDK: `@base-org/account` (npm package)
- `pay()` triggers a wallet popup, user confirms USDC payment
- `getPaymentStatus()` to verify payment completed
- Can collect email via `payerInfo`

## What to Do

### 1. Install SDK
```bash
npm install @base-org/account
```

### 2. Remove Stripe
- Delete `src/lib/stripe.ts`
- Delete `src/app/api/payments/stripe/` (checkout, webhook, portal routes)
- Remove `stripe` from package.json dependencies
- Remove all Stripe env vars references (STRIPE_SECRET_KEY, STRIPE_PRICE_ID, STRIPE_WEBHOOK_SECRET)

### 3. Create Base Pay Integration

**New API route: `src/app/api/payments/base-pay/verify/route.ts`**
- Accept `paymentId` from the client after `pay()` completes
- Use `getPaymentStatus()` server-side to verify the payment is `completed`
- Verify the amount matches our Pro plan price (e.g., $9.99 USDC)
- Check payment hasn't been used before (store payment IDs)
- Activate 30-day Pro subscription (same pattern as SNR verify)

**New client helper: `src/lib/base-pay.ts`**
- Export a `payWithBase()` function that calls `pay()` with our config
- Amount: match current Pro plan pricing in USDC
- `to`: our USDC receiving wallet address (use env var `NEXT_PUBLIC_PAYMENT_WALLET`)
- Set `testnet: false` for production

### 4. Update Pricing Page (`src/app/pricing/page.tsx`)
- Replace the Stripe checkout button with a "Pay with Base" button
- On click: call `pay()` from `@base-org/account`
- After payment completes: call our verify API with the payment ID
- Show success/error states
- Keep the SNR token payment option alongside Base Pay
- Update the `payment_method` value from `'stripe'` to `'base_pay'` in subscriptions

### 5. Update Subscription Model
- In `src/lib/subscription.ts`: update types to include `'base_pay'` as a payment_method option
- The subscription table schema already supports different payment methods

### 6. Clean Up
- Remove any Stripe-related imports throughout the codebase
- Update any references to Stripe in comments or config
- Make sure the build passes (`npm run build`)

## Env Vars Needed
- `NEXT_PUBLIC_PAYMENT_WALLET` — our USDC receiving address on Base
- Remove: STRIPE_SECRET_KEY, STRIPE_PRICE_ID, STRIPE_WEBHOOK_SECRET

## Important
- Keep SNR token payments working (don't touch `/api/payments/snr/verify/`)
- The subscription model stays the same — just swap the payment provider
- USDC amount should be defined as a constant (easy to change later)
- Test the build compiles cleanly
