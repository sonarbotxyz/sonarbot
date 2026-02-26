import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db';

// ── Reward constants (update manually as taper schedule progresses) ──
// Launch Week: 500M total (300M product, 150M curators, 50M burn)
// Weeks 2-4: 150M/week (90M product, 45M curators, 15M burn)
// Month 2-3: 100M/week (60M product, 30M curators, 10M burn)
// Month 4-6: 42.5M/week (25M product, 12.5M curators, 5M burn)
// Month 7-12: 17M/week (10M product, 5M curators, 2M burn)
// Year 2+: 5M/week (3M product, 1.5M curators, 0.5M burn)
const PRODUCT_REWARD = 300_000_000;  // #1 Product of the Week — winner takes all
const CURATOR_POOL = 150_000_000;    // Top 20 curators, proportional by score
const BURN_AMOUNT = 50_000_000;      // Burned per epoch

// POST /api/admin/epoch - Calculate and distribute weekly rewards with curation scoring (admin only)
export async function POST(request: NextRequest) {
  try {
    // Check admin API key
    const adminKey = process.env.ADMIN_API_KEY;
    const authHeader = request.headers.get('Authorization');
    const providedKey = authHeader?.replace(/^Bearer\s+/i, '').trim();

    if (!adminKey || !providedKey || providedKey !== adminKey) {
      return NextResponse.json(
        { error: 'Admin API key required' },
        { status: 401 }
      );
    }

    const supabase = getSupabase();

    // Calculate epoch dates (last Monday 00:00 UTC to Sunday 23:59 UTC)
    const now = new Date();
    const lastMonday = new Date(now);
    const daysToMonday = (lastMonday.getDay() + 6) % 7; // Monday = 0
    lastMonday.setDate(lastMonday.getDate() - daysToMonday - 7); // Go back to last week's Monday
    lastMonday.setUTCHours(0, 0, 0, 0);

    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastSunday.getDate() + 6);
    lastSunday.setUTCHours(23, 59, 59, 999);

    console.log('Calculating epoch:', {
      start: lastMonday.toISOString(),
      end: lastSunday.toISOString()
    });

    // Check if rewards for this epoch already exist
    try {
      const { data: existingRewards } = await supabase
        .from('weekly_rewards')
        .select('id')
        .eq('epoch_start', lastMonday.toISOString())
        .limit(1);

      if (existingRewards && existingRewards.length > 0) {
        return NextResponse.json(
          { error: 'Rewards for this epoch have already been calculated' },
          { status: 409 }
        );
      }
    } catch (e) {
      console.error('Error checking existing rewards (table may not exist):', e);
    }

    // ── Step 1: Get all upvotes for the epoch week ──
    let upvotesData: { project_id: string; twitter_handle: string; created_at: string }[] = [];
    try {
      const { data, error } = await supabase
        .from('project_upvotes')
        .select('project_id, twitter_handle, created_at')
        .gte('created_at', lastMonday.toISOString())
        .lte('created_at', lastSunday.toISOString());

      if (error) {
        console.error('Error fetching upvotes:', error);
        return NextResponse.json({ error: 'Failed to fetch upvotes: ' + error.message }, { status: 500 });
      }
      upvotesData = data || [];
    } catch (e) {
      console.error('Error querying project_upvotes:', e);
      return NextResponse.json({ error: 'Failed to query project_upvotes table' }, { status: 500 });
    }

    // ── Step 2: Get all comments for the epoch week ──
    let commentsData: { project_id: string; twitter_handle: string; created_at: string; content: string }[] = [];
    try {
      const { data, error } = await supabase
        .from('project_comments')
        .select('project_id, twitter_handle, created_at, content')
        .gte('created_at', lastMonday.toISOString())
        .lte('created_at', lastSunday.toISOString());

      if (error) {
        console.error('Error fetching comments:', error);
        // Comments table might not exist, continue without comments
      } else {
        commentsData = data || [];
      }
    } catch (e) {
      console.error('Error querying project_comments:', e);
    }

    // ── Step 3: Get product created_at dates for early discovery bonus ──
    const allProjectIds = new Set<string>();
    for (const u of upvotesData) allProjectIds.add(u.project_id);
    for (const c of commentsData) allProjectIds.add(c.project_id);

    const projectCreatedAt: Record<string, string> = {};
    const projectNames: Record<string, string> = {};
    const projectHandles: Record<string, string> = {};

    if (allProjectIds.size > 0) {
      try {
        const { data: projects } = await supabase
          .from('projects')
          .select('id, name, twitter_handle, created_at')
          .in('id', Array.from(allProjectIds));

        if (projects) {
          for (const p of projects) {
            projectCreatedAt[p.id] = p.created_at;
            projectNames[p.id] = p.name;
            projectHandles[p.id] = p.twitter_handle;
          }
        }
      } catch (e) {
        console.error('Error fetching project details:', e);
      }
    }

    // ── Step 4: Rank products by upvote count ──
    const productUpvoteCounts = new Map<string, number>();
    for (const u of upvotesData) {
      productUpvoteCounts.set(u.project_id, (productUpvoteCounts.get(u.project_id) || 0) + 1);
    }

    const rankedProducts = Array.from(productUpvoteCounts.entries())
      .sort(([, a], [, b]) => b - a);

    // Build rank lookup: project_id -> rank (1-indexed)
    const productRank: Record<string, number> = {};
    rankedProducts.forEach(([projectId], idx) => {
      productRank[projectId] = idx + 1;
    });

    // ── Step 5: Scoring functions ──
    function getUpvotePoints(rank: number): number {
      if (rank === 1) return 10;
      if (rank === 2) return 8;
      if (rank === 3) return 6;
      if (rank >= 4 && rank <= 10) return 3;
      return 0;
    }

    function getCommentPoints(rank: number): number {
      if (rank >= 1 && rank <= 3) return 5;
      if (rank >= 4 && rank <= 10) return 2;
      return 0;
    }

    function isEarlyDiscovery(actionCreatedAt: string, productId: string): boolean {
      const productDate = projectCreatedAt[productId];
      if (!productDate) return false;
      const productTime = new Date(productDate).getTime();
      const actionTime = new Date(actionCreatedAt).getTime();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      return (actionTime - productTime) <= twentyFourHours && (actionTime - productTime) >= 0;
    }

    // ── Step 6: Calculate each curator's score ──
    const curatorScores = new Map<string, number>();

    // Score upvotes
    for (const u of upvotesData) {
      const rank = productRank[u.project_id];
      if (!rank) continue;
      let points = getUpvotePoints(rank);
      if (points > 0 && isEarlyDiscovery(u.created_at, u.project_id)) {
        points *= 2;
      }
      if (points > 0) {
        curatorScores.set(u.twitter_handle, (curatorScores.get(u.twitter_handle) || 0) + points);
      }
    }

    // Score comments (min 20 chars, only 1 per product per user counts)
    const commentedProductsByUser = new Map<string, Set<string>>();
    for (const c of commentsData) {
      if (c.content.length < 20) continue;

      const userKey = c.twitter_handle;
      if (!commentedProductsByUser.has(userKey)) {
        commentedProductsByUser.set(userKey, new Set());
      }
      const userProducts = commentedProductsByUser.get(userKey)!;
      if (userProducts.has(c.project_id)) continue; // Already counted this product
      userProducts.add(c.project_id);

      const rank = productRank[c.project_id];
      if (!rank) continue;
      let points = getCommentPoints(rank);
      if (points > 0 && isEarlyDiscovery(c.created_at, c.project_id)) {
        points *= 2;
      }
      if (points > 0) {
        curatorScores.set(c.twitter_handle, (curatorScores.get(c.twitter_handle) || 0) + points);
      }
    }

    // ── Step 7: Get top 20 curators and distribute proportionally ──
    const sortedCurators = Array.from(curatorScores.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20);

    const totalCuratorScore = sortedCurators.reduce((sum, [, score]) => sum + score, 0);

    const curatorRewards: { handle: string; score: number; reward: number }[] = [];
    if (totalCuratorScore > 0) {
      for (const [handle, score] of sortedCurators) {
        const reward = Math.floor((score / totalCuratorScore) * CURATOR_POOL);
        if (reward > 0) {
          curatorRewards.push({ handle, score, reward });
        }
      }
    }

    // ── Step 8: #1 Product of the Week (winner takes all) ──
    const winner = rankedProducts.length > 0 ? rankedProducts[0] : null;

    // ── Step 9: Prepare and insert rewards ──
    const rewards = [];

    // Product reward — only #1
    if (winner) {
      const [projectId] = winner;
      rewards.push({
        epoch_start: lastMonday.toISOString(),
        epoch_end: lastSunday.toISOString(),
        product_id: projectId,
        twitter_handle: projectHandles[projectId] || null,
        reward_type: 'product_of_week',
        snr_amount: PRODUCT_REWARD,
        claimed: false,
        wallet_address: null
      });
    }

    // Curator rewards (proportional)
    for (const curator of curatorRewards) {
      rewards.push({
        epoch_start: lastMonday.toISOString(),
        epoch_end: lastSunday.toISOString(),
        product_id: null,
        twitter_handle: curator.handle,
        reward_type: 'curator',
        snr_amount: curator.reward,
        claimed: false,
        wallet_address: null
      });
    }

    // Insert rewards
    if (rewards.length > 0) {
      try {
        const { error: insertError } = await supabase
          .from('weekly_rewards')
          .insert(rewards);

        if (insertError) {
          console.error('Error inserting rewards:', insertError);
          return NextResponse.json({ error: 'Failed to insert rewards: ' + insertError.message }, { status: 500 });
        }
      } catch (e) {
        console.error('Error inserting into weekly_rewards:', e);
        return NextResponse.json({ error: 'Failed to insert into weekly_rewards table' }, { status: 500 });
      }
    }

    // Calculate totals
    const productRewardsTotal = winner ? PRODUCT_REWARD : 0;
    const curatorRewardsTotal = curatorRewards.reduce((sum, c) => sum + c.reward, 0);
    const totalRewards = productRewardsTotal + curatorRewardsTotal + BURN_AMOUNT;

    return NextResponse.json({
      success: true,
      epoch: {
        start: lastMonday.toISOString(),
        end: lastSunday.toISOString()
      },
      product_of_week: winner ? {
        name: projectNames[winner[0]] || winner[0],
        handle: projectHandles[winner[0]] || null,
        upvotes: winner[1],
        reward: PRODUCT_REWARD
      } : null,
      top_curators: curatorRewards.map((c, i) => ({
        rank: i + 1,
        handle: c.handle,
        score: c.score,
        reward: c.reward
      })),
      scoring_summary: {
        total_products_ranked: rankedProducts.length,
        total_curators_scored: curatorScores.size,
        total_upvotes_processed: upvotesData.length,
        total_comments_processed: commentsData.length
      },
      summary: {
        total_rewards_distributed: totalRewards,
        product_rewards: productRewardsTotal,
        curator_rewards: curatorRewardsTotal,
        burned: BURN_AMOUNT
      }
    });
  } catch (error) {
    console.error('Error calculating epoch:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
