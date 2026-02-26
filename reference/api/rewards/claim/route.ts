import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db';
import { validateApiKey } from '@/lib/auth';

// POST /api/rewards/claim - Claim unclaimed rewards
export async function POST(request: NextRequest) {
  try {
    // Validate API key
    const authedHandle = await validateApiKey(request);
    if (!authedHandle) {
      return NextResponse.json(
        { error: 'Valid API key required. Register at POST /api/register with your twitter_handle.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { wallet_address } = body;

    if (!wallet_address || !wallet_address.startsWith('0x')) {
      return NextResponse.json(
        { error: 'Valid wallet_address is required (must start with 0x)' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    
    // Check if user has unclaimed rewards
    const { data: unclaimedRewards, error: fetchError } = await supabase
      .from('weekly_rewards')
      .select('*')
      .eq('twitter_handle', authedHandle)
      .eq('claimed', false);

    if (fetchError) {
      console.error('Database error:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch rewards' }, { status: 500 });
    }

    if (!unclaimedRewards || unclaimedRewards.length === 0) {
      return NextResponse.json(
        { error: 'No unclaimed rewards found' },
        { status: 404 }
      );
    }

    // Mark all unclaimed rewards as claimed and store wallet address
    const rewardIds = unclaimedRewards.map(r => r.id);
    const { error: updateError } = await supabase
      .from('weekly_rewards')
      .update({
        claimed: true,
        wallet_address: wallet_address
      })
      .in('id', rewardIds);

    if (updateError) {
      console.error('Database error:', updateError);
      return NextResponse.json({ error: 'Failed to claim rewards' }, { status: 500 });
    }

    const totalClaimed = unclaimedRewards.reduce((sum, reward) => sum + Number(reward.snr_amount), 0);

    return NextResponse.json({
      success: true,
      claimed_rewards: unclaimedRewards.length,
      total_snr: totalClaimed,
      wallet_address: wallet_address,
      message: `Successfully claimed ${totalClaimed} $SNR tokens`
    });
  } catch (error) {
    console.error('Error claiming rewards:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}