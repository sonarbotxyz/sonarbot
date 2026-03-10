import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { getStripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const supabase = getSupabase();

    // Get or create user
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("privy_id", auth.userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user already has an active Stripe subscription
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id, status, plan")
      .eq("user_id", user.id)
      .single();

    if (existingSub?.plan === "pro" && existingSub?.status === "active") {
      return NextResponse.json(
        { error: "Already subscribed to Pro" },
        { status: 400 }
      );
    }

    // Create or reuse Stripe customer
    let customerId = existingSub?.stripe_customer_id;
    if (!customerId) {
      const customer = await getStripe().customers.create({
        metadata: {
          user_id: user.id,
          privy_id: auth.userId,
          handle: auth.handle,
        },
      });
      customerId = customer.id;
    }

    const origin = request.headers.get("origin") || request.nextUrl.origin;

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],
      success_url: `${origin}/pricing?success=true`,
      cancel_url: `${origin}/pricing?canceled=true`,
      metadata: {
        user_id: user.id,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
