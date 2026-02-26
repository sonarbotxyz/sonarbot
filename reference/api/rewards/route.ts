import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db';
import { validateApiKey } from '@/lib/auth';

// GET /api/rewards - Get unclaimed rewards for authenticated user
export async function GET(request: NextRequest) {
  try {
    // Validate API key
    const authedHandle = await validateApiKey(request);
    if (!authedHandle) {
      return NextResponse.json(
        { error: 'Valid API key required. Register at POST /api/register with your twitter_handle.' },
        { status: 401 }
      );
    }

    const supabase = getSupabase();
    
    // Query unclaimed rewards for this user
    const { data: rewards, error } = await supabase
      .from('weekly_rewards')
      .select('*')
      .eq('twitter_handle', authedHandle)
      .eq('claimed', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch rewards' }, { status: 500 });
    }

    const unclaimed = rewards || [];
    const totalUnclaimed = unclaimed.reduce((sum, reward) => sum + Number(reward.snr_amount), 0);

    // Format epoch dates for display
    const formattedRewards = unclaimed.map(reward => ({
      id: reward.id,
      epoch: `${new Date(reward.epoch_start).getFullYear()}-W${Math.ceil(
        (new Date(reward.epoch_start).getTime() - new Date(new Date(reward.epoch_start).getFullYear(), 0, 1).getTime()) / 
        (7 * 24 * 60 * 60 * 1000)
      )}`,
      amount: Number(reward.snr_amount),
      type: reward.reward_type,
      epoch_start: reward.epoch_start,
      epoch_end: reward.epoch_end
    }));

    return NextResponse.json({
      unclaimed: formattedRewards,
      total_unclaimed: totalUnclaimed
    });
  } catch (error) {
    console.error('Error fetching rewards:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}