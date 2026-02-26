import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

// GET - Get subscription status
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Authentication required. Use API key (agents) or sign in with X (humans).' },
        { status: 401 }
      );
    }

    const supabase = getSupabase();
    const { handle } = auth;

    // Get subscription info from api_keys table
    const { data, error } = await supabase
      .from('api_keys')
      .select('subscription_tier, subscription_expires')
      .eq('twitter_handle', handle)
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch subscription status' }, { status: 500 });
    }

    const tier = data?.subscription_tier || 'free';
    const expires = data?.subscription_expires;

    let daysRemaining = 0;
    if (tier === 'premium' && expires) {
      const expiryDate = new Date(expires);
      const now = new Date();
      if (expiryDate > now) {
        daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      } else {
        // Expired premium should revert to free
        await supabase
          .from('api_keys')
          .update({ subscription_tier: 'free' })
          .eq('twitter_handle', handle);
        return NextResponse.json({ tier: 'free', expires: null, days_remaining: 0 });
      }
    }

    return NextResponse.json({
      tier,
      expires,
      days_remaining: daysRemaining
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Get payment instructions
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Authentication required. Use API key (agents) or sign in with X (humans).' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { wallet_address } = body; // Optional, for future rewards
    const { handle } = auth;

    // Store wallet address if provided
    if (wallet_address) {
      const supabase = getSupabase();
      await supabase
        .from('api_keys')
        .update({ wallet_address })
        .eq('twitter_handle', handle);
    }

    // Get payment address from environment (trim any whitespace/newlines)
    const paymentAddress = process.env.SNR_PAYMENT_ADDRESS?.trim();
    if (!paymentAddress) {
      return NextResponse.json(
        { error: 'Payment system not configured' },
        { status: 500 }
      );
    }

    // Fetch live $SNR price to show required amount
    let snrPrice: number | null = null;
    let snrAmount: string | null = null;
    try {
      const dexRes = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/0xE1231f809124e4Aa556cD9d8c28CB33f02c75b07`
      );
      const dexData = await dexRes.json();
      const pair = dexData.pairs?.find(
        (p: any) =>
          p.baseToken?.address?.toLowerCase() ===
            '0xe1231f809124e4aa556cd9d8c28cb33f02c75b07' && p.priceUsd
      );
      if (pair?.priceUsd) {
        snrPrice = parseFloat(pair.priceUsd);
        snrAmount = Math.ceil(9.99 / snrPrice).toLocaleString();
      }
    } catch {
      // Price fetch failed — still return instructions without amount
    }

    return NextResponse.json({
      payment_address: paymentAddress,
      price_usd: '$9.99/month',
      minimum_usd: '$9.50',
      payment_token: '$SNR',
      snr_price_usd: snrPrice ? `$${snrPrice.toFixed(8)}` : 'unavailable',
      snr_amount_required: snrAmount ?? 'check price and send at least $9.50 worth',
      token_contract: '0xE1231f809124e4Aa556cD9d8c28CB33f02c75b07',
      chain: 'Base',
      duration: '30 days',
      instructions: `Send ${snrAmount ? snrAmount + ' $SNR' : 'at least $9.50 worth of $SNR'} to the payment address, then call /api/subscribe/confirm with the tx hash.`
    });
  } catch (error) {
    console.error('Error getting payment instructions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}