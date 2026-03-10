import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { PLAN_LIMITS } from "@/lib/subscription";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const supabase = getSupabase();

    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("privy_id", auth.userId)
      .single();

    if (!user) {
      return NextResponse.json({
        plan: "free",
        status: "active",
        limits: PLAN_LIMITS.free,
      });
    }

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!sub || sub.plan === "free" || sub.status !== "active") {
      // Check SNR expiry
      if (
        sub?.payment_method === "snr" &&
        sub?.current_period_end &&
        new Date(sub.current_period_end) < new Date()
      ) {
        return NextResponse.json({
          plan: "free",
          status: "expired",
          payment_method: sub.payment_method,
          limits: PLAN_LIMITS.free,
        });
      }

      return NextResponse.json({
        plan: sub?.plan || "free",
        status: sub?.status || "active",
        limits: PLAN_LIMITS[sub?.plan as keyof typeof PLAN_LIMITS || "free"],
      });
    }

    return NextResponse.json({
      plan: sub.plan,
      status: sub.status,
      payment_method: sub.payment_method,
      current_period_end: sub.current_period_end,
      limits: PLAN_LIMITS[sub.plan as keyof typeof PLAN_LIMITS],
    });
  } catch (error) {
    console.error("Subscription status error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}
