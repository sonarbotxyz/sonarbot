import { getSupabase } from "./supabase";

export const PLAN_LIMITS = {
  free: {
    maxWatches: 3,
    signalTypes: ["metrics_milestones"],
    priorityNotifications: false,
    fullAnalytics: false,
  },
  pro: {
    maxWatches: Infinity,
    signalTypes: [
      "metrics_milestones",
      "new_features_launches",
      "partnerships_integrations",
      "all_updates",
      "token_events",
    ],
    priorityNotifications: true,
    fullAnalytics: true,
  },
} as const;

export interface Subscription {
  id: string;
  user_id: string;
  plan: "free" | "pro";
  status: "active" | "canceled" | "past_due";
  payment_method: "stripe" | "snr" | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  snr_wallet_address: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

/** Fetch subscription for a user by their internal UUID */
export async function getSubscription(
  userId: string
): Promise<Subscription | null> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();

  return data as Subscription | null;
}

/** Check if user has an active Pro subscription */
export async function isPro(userId: string): Promise<boolean> {
  const sub = await getSubscription(userId);
  if (!sub) return false;
  if (sub.plan !== "pro") return false;
  if (sub.status !== "active") return false;

  // For SNR payments, check if period hasn't expired
  if (sub.payment_method === "snr" && sub.current_period_end) {
    return new Date(sub.current_period_end) > new Date();
  }

  return true;
}

/** Check if user can add another watch (under limit for free tier) */
export async function canWatch(userId: string): Promise<boolean> {
  const pro = await isPro(userId);
  if (pro) return true;

  const supabase = getSupabase();
  const { count } = await supabase
    .from("watches")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  return (count ?? 0) < PLAN_LIMITS.free.maxWatches;
}

/** Resolve privy_id to internal user UUID */
export async function resolveUserId(
  privyId: string
): Promise<string | null> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("privy_id", privyId)
    .single();

  return data?.id ?? null;
}
