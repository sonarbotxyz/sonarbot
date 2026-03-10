import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabase } from "@/lib/supabase";
import { getStripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    let event: Stripe.Event;
    try {
      event = getStripe().webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (!userId) {
          console.error("No user_id in checkout session metadata");
          break;
        }

        // Fetch the subscription to get period dates from items
        const stripeSubscription =
          await getStripe().subscriptions.retrieve(subscriptionId);
        const item = stripeSubscription.items.data[0];

        await supabase.from("subscriptions").upsert(
          {
            user_id: userId,
            plan: "pro",
            status: "active",
            payment_method: "stripe",
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            current_period_start: item
              ? new Date(item.current_period_start * 1000).toISOString()
              : new Date().toISOString(),
            current_period_end: item
              ? new Date(item.current_period_end * 1000).toISOString()
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          },
          { onConflict: "user_id" }
        );

        // Also update users table plan
        await supabase
          .from("users")
          .update({ plan: "pro" })
          .eq("id", userId);

        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const subItem = subscription.items.data[0];
        const status = subscription.cancel_at_period_end
          ? "canceled"
          : subscription.status === "active"
            ? "active"
            : "past_due";

        const updateData: Record<string, string> = { status };
        if (subItem) {
          updateData.current_period_start = new Date(
            subItem.current_period_start * 1000
          ).toISOString();
          updateData.current_period_end = new Date(
            subItem.current_period_end * 1000
          ).toISOString();
        }

        await supabase
          .from("subscriptions")
          .update(updateData)
          .eq("stripe_subscription_id", subscription.id);

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        const { data: sub } = await supabase
          .from("subscriptions")
          .update({
            status: "canceled",
            plan: "free",
          })
          .eq("stripe_subscription_id", subscription.id)
          .select("user_id")
          .single();

        // Revert users table plan
        if (sub) {
          await supabase
            .from("users")
            .update({ plan: "free" })
            .eq("id", sub.user_id);
        }

        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
