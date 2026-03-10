import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, parseAbi, type Hex } from "viem";
import { base } from "viem/chains";
import { authenticateRequest } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

const ERC20_TRANSFER_ABI = parseAbi([
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);

const client = createPublicClient({
  chain: base,
  transport: http(
    `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
  ),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { tx_hash } = await request.json();
    if (!tx_hash || typeof tx_hash !== "string") {
      return NextResponse.json(
        { error: "tx_hash is required" },
        { status: 400 }
      );
    }

    const snrContract = process.env.SNR_CONTRACT_ADDRESS as Hex;
    const paymentWallet = process.env.PAYMENT_WALLET_ADDRESS?.toLowerCase();
    const requiredAmount = BigInt(process.env.SNR_MONTHLY_AMOUNT || "0");

    if (!snrContract || !paymentWallet || !requiredAmount) {
      return NextResponse.json(
        { error: "SNR payment not configured" },
        { status: 503 }
      );
    }

    // Get transaction receipt
    const receipt = await client.getTransactionReceipt({
      hash: tx_hash as Hex,
    });

    if (!receipt || receipt.status !== "success") {
      return NextResponse.json(
        { error: "Transaction not found or failed" },
        { status: 400 }
      );
    }

    // Parse Transfer events from the tx logs
    let verified = false;
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== snrContract.toLowerCase()) continue;

      try {
        const decoded = {
          to: ("0x" + log.topics[2]?.slice(26)) as string,
          value: BigInt(log.data),
        };

        if (
          decoded.to.toLowerCase() === paymentWallet &&
          decoded.value >= requiredAmount
        ) {
          verified = true;
          break;
        }
      } catch {
        continue;
      }
    }

    if (!verified) {
      return NextResponse.json(
        {
          error:
            "Transaction does not match: wrong token, amount, or recipient",
        },
        { status: 400 }
      );
    }

    // Check tx hasn't already been used
    const supabase = getSupabase();

    const { data: existingTx } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("snr_wallet_address", tx_hash)
      .single();

    if (existingTx) {
      return NextResponse.json(
        { error: "Transaction already used" },
        { status: 400 }
      );
    }

    // Get user
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("privy_id", auth.userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Activate 30-day Pro subscription
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Check if user has existing active SNR sub — extend it
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("current_period_end")
      .eq("user_id", user.id)
      .eq("plan", "pro")
      .eq("status", "active")
      .eq("payment_method", "snr")
      .single();

    let effectiveEnd = periodEnd;
    if (existingSub?.current_period_end) {
      const existingEnd = new Date(existingSub.current_period_end);
      if (existingEnd > now) {
        effectiveEnd = new Date(
          existingEnd.getTime() + 30 * 24 * 60 * 60 * 1000
        );
      }
    }

    await supabase.from("subscriptions").upsert(
      {
        user_id: user.id,
        plan: "pro",
        status: "active",
        payment_method: "snr",
        snr_wallet_address: tx_hash,
        current_period_start: now.toISOString(),
        current_period_end: effectiveEnd.toISOString(),
      },
      { onConflict: "user_id" }
    );

    // Update users table
    await supabase.from("users").update({ plan: "pro" }).eq("id", user.id);

    return NextResponse.json({
      success: true,
      plan: "pro",
      current_period_end: effectiveEnd.toISOString(),
    });
  } catch (error) {
    console.error("SNR verify error:", error);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}
