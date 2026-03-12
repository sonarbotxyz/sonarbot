import { NextRequest, NextResponse } from "next/server";
import { getPaymentStatus } from "@base-org/account/node";
import { authenticateRequest } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { paymentId } = await request.json();
    if (!paymentId || typeof paymentId !== "string") {
      return NextResponse.json(
        { error: "paymentId is required" },
        { status: 400 }
      );
    }

    // Verify payment status with Base Pay
    const { status } = await getPaymentStatus({
      id: paymentId,
      testnet: false,
    });

    if (status !== "completed") {
      return NextResponse.json(
        { error: `Payment not completed. Status: ${status}` },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Check payment ID hasn't already been used (stored in stripe_subscription_id column)
    const { data: existingTx } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("stripe_subscription_id", paymentId)
      .single();

    if (existingTx) {
      return NextResponse.json(
        { error: "Payment already used" },
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

    // Calculate subscription period
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Check for existing active sub — extend it
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("current_period_end")
      .eq("user_id", user.id)
      .eq("plan", "pro")
      .eq("status", "active")
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
        payment_method: "base_pay",
        stripe_customer_id: null,
        stripe_subscription_id: paymentId,
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
    console.error("Base Pay verify error:", error);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}
