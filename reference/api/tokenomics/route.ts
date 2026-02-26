import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db';

// ── Reward constants (must match epoch/route.ts) ──
const BURN_AMOUNT = 50_000_000; // 50M $SNR burned per epoch (launch week)

// GET /api/tokenomics - Get tokenomics transparency data
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();

    // Get weekly rewards summary - catch errors gracefully
    let weeklyRewards = null;
    try {
      const { data, error: rewardsError } = await supabase
        .from('weekly_rewards')
        .select('*')
        .order('epoch_start', { ascending: false });

      if (rewardsError) {
        console.error('Database error (weekly_rewards table may not exist):', rewardsError);
      } else {
        weeklyRewards = data;
      }
    } catch (e) {
      console.error('Error fetching weekly rewards:', e);
    }

    // Group rewards by epoch and calculate totals
    const epochRewards = new Map<string, {
      epoch: string;
      total_rewards: number;
      product_rewards: number;
      curator_rewards: number;
      burn_amount: number;
    }>();

    if (weeklyRewards) {
      for (const reward of weeklyRewards) {
        const epochKey = reward.epoch_start;
        const epochLabel = formatEpochLabel(reward.epoch_start);
        
        const existing = epochRewards.get(epochKey);
        const rewardAmount = Number(reward.snr_amount);
        
        if (existing) {
          existing.total_rewards += rewardAmount;
          if (reward.reward_type === 'curator') {
            existing.curator_rewards += rewardAmount;
          } else {
            existing.product_rewards += rewardAmount;
          }
        } else {
          epochRewards.set(epochKey, {
            epoch: epochLabel,
            total_rewards: rewardAmount,
            product_rewards: reward.reward_type === 'curator' ? 0 : rewardAmount,
            curator_rewards: reward.reward_type === 'curator' ? rewardAmount : 0,
            burn_amount: BURN_AMOUNT // As per tokenomics plan - tapers over time
          });
        }
      }
    }

    // Convert to array and sort by epoch
    const weeklyRewardsSummary = Array.from(epochRewards.values()).sort((a, b) => b.epoch.localeCompare(a.epoch));

    // Calculate total $SNR burned (placeholder - will be populated from onchain data later)
    const totalRewardsBurned = weeklyRewardsSummary.reduce((sum, epoch) => sum + epoch.burn_amount, 0);
    const subscriptionsBurned = 0; // TODO: Calculate from subscription burns
    const sponsoredBurned = 0; // TODO: Calculate from USDC buybacks
    const totalSnrBurned = totalRewardsBurned + subscriptionsBurned + sponsoredBurned;

    // Get active subscriptions count - catch errors gracefully
    let activeSubscriptions = 0;
    let subscriptionRevenue = 0;
    try {
      const { data: subscriptionsCount, error: subError } = await supabase
        .from('api_keys')
        .select('id', { count: 'exact' })
        .eq('subscription_tier', 'premium')
        .gt('subscription_expires', new Date().toISOString());

      if (!subError && subscriptionsCount) {
        activeSubscriptions = Array.isArray(subscriptionsCount) ? subscriptionsCount.length : Number(subscriptionsCount);
        subscriptionRevenue = activeSubscriptions * 1000;
      }
    } catch (e) {
      console.error('Error fetching subscriptions:', e);
    }

    // Get sponsored revenue total - catch errors gracefully
    let sponsoredRevenue = 0;
    try {
      const { data: sponsoredSpots, error: sponsoredError } = await supabase
        .from('sponsored_spots')
        .select('usdc_paid');

      if (!sponsoredError && sponsoredSpots) {
        sponsoredRevenue = sponsoredSpots.reduce((sum, spot) => sum + Number(spot.usdc_paid), 0);
      }
    } catch (e) {
      console.error('Error fetching sponsored spots:', e);
    }

    // Return fallback data if no real data exists
    const fallbackData = {
      total_snr_burned: totalSnrBurned || 0,
      weekly_rewards: weeklyRewardsSummary.length > 0 ? weeklyRewardsSummary : [],
      active_subscriptions: activeSubscriptions,
      sponsored_revenue: sponsoredRevenue,
      subscription_revenue: subscriptionRevenue
    };

    return NextResponse.json(fallbackData);
  } catch (error) {
    console.error('Error fetching tokenomics data:', error);
    // Return fallback data on ANY database error
    return NextResponse.json({
      total_snr_burned: 0,
      weekly_rewards: [],
      active_subscriptions: 0,
      sponsored_revenue: 0,
      subscription_revenue: 0
    });
  }
}

function formatEpochLabel(epochStart: string): string {
  const date = new Date(epochStart);
  const year = date.getFullYear();
  const weekNumber = Math.ceil(
    (date.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)
  );
  return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
}