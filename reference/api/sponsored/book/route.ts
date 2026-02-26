import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { USDC_CONTRACT, SNR_CONTRACT } from '@/lib/verifySpotPayment';

const PRICING: Record<string, number> = {
  homepage_inline: 299,
  project_sidebar: 149,
};

const SNR_DISCOUNT = 0.20;
const HOLD_MINUTES = 5;

// POST /api/sponsored/book — Reserve a slot
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Authentication required. Use API key (Bearer snr_...) or Privy token.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { spot_type, week_start, title, description, url, image_url, payment_token } = body;

    // Validate required fields
    if (!spot_type || !week_start || !title || !url || !payment_token) {
      return NextResponse.json(
        { error: 'Missing required fields: spot_type, week_start, title, url, payment_token' },
        { status: 400 }
      );
    }

    // Validate spot_type
    if (!PRICING[spot_type]) {
      return NextResponse.json(
        { error: `Invalid spot_type. Must be one of: ${Object.keys(PRICING).join(', ')}` },
        { status: 400 }
      );
    }

    // Validate title length
    if (title.length > 60) {
      return NextResponse.json(
        { error: 'Title must be 60 characters or less' },
        { status: 400 }
      );
    }

    // Validate description length
    if (description && description.length > 120) {
      return NextResponse.json(
        { error: 'Description must be 120 characters or less' },
        { status: 400 }
      );
    }

    // Validate URL
    if (!url.startsWith('https://')) {
      return NextResponse.json(
        { error: 'URL must start with https://' },
        { status: 400 }
      );
    }

    // Validate payment_token
    if (!['USDC', 'SNR'].includes(payment_token)) {
      return NextResponse.json(
        { error: 'payment_token must be USDC or SNR' },
        { status: 400 }
      );
    }

    // Validate week_start is a Monday
    const weekDate = new Date(week_start + 'T00:00:00Z');
    if (isNaN(weekDate.getTime()) || weekDate.getUTCDay() !== 1) {
      return NextResponse.json(
        { error: 'week_start must be a valid date that falls on a Monday (YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    const weekEnd = new Date(weekDate);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    const supabase = getSupabase();
    const now = new Date();

    // Clean up expired holds for this slot+week
    try {
      await supabase
        .from('sponsored_spots')
        .delete()
        .eq('spot_type', spot_type)
        .eq('week_start', week_start)
        .eq('status', 'held')
        .lt('hold_expires_at', now.toISOString());
    } catch (e) {
      console.error('Error cleaning expired holds:', e);
    }

    // Check if slot is already booked/held for this week
    const { data: existing, error: checkError } = await supabase
      .from('sponsored_spots')
      .select('id, status, hold_expires_at')
      .eq('spot_type', spot_type)
      .eq('week_start', week_start)
      .in('status', ['active', 'held']);

    if (checkError) {
      console.error('Database error checking slot:', checkError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (existing && existing.length > 0) {
      const activeOrValidHeld = existing.find(
        s => s.status === 'active' || (s.status === 'held' && s.hold_expires_at && s.hold_expires_at > now.toISOString())
      );
      if (activeOrValidHeld) {
        return NextResponse.json(
          { error: 'This slot is already booked or held for the selected week' },
          { status: 409 }
        );
      }
    }

    // Calculate pricing
    const basePrice = PRICING[spot_type];
    const isSNR = payment_token === 'SNR';
    const amount = isSNR ? parseFloat((basePrice * (1 - SNR_DISCOUNT)).toFixed(2)) : basePrice;
    const tokenLabel = isSNR ? '$SNR' : 'USDC';
    const tokenContract = isSNR ? SNR_CONTRACT : USDC_CONTRACT;

    const paymentAddress = process.env.SPONSORED_PAYMENT_ADDRESS || process.env.SNR_PAYMENT_ADDRESS;
    if (!paymentAddress) {
      return NextResponse.json({ error: 'Payment address not configured' }, { status: 500 });
    }

    const holdExpiresAt = new Date(now.getTime() + HOLD_MINUTES * 60 * 1000);

    // Create the booking with hold
    const { data: spot, error: insertError } = await supabase
      .from('sponsored_spots')
      .insert({
        spot_type,
        advertiser: auth.handle,
        booked_by: auth.handle,
        title,
        description: description || null,
        url,
        image_url: image_url || null,
        payment_token,
        payment_amount: amount,
        usdc_paid: 0,
        starts_at: new Date(week_start + 'T00:00:00Z').toISOString(),
        ends_at: new Date(weekEndStr + 'T23:59:59Z').toISOString(),
        week_start,
        week_end: weekEndStr,
        status: 'held',
        hold_expires_at: holdExpiresAt.toISOString(),
        active: false,
      })
      .select('id')
      .single();

    if (insertError || !spot) {
      console.error('Error creating booking:', insertError);
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
    }

    return NextResponse.json({
      booking_id: spot.id,
      payment_instructions: {
        address: paymentAddress,
        amount,
        token: tokenLabel,
        token_contract: tokenContract,
        chain: 'Base',
        expires_at: holdExpiresAt.toISOString(),
      },
      spot: {
        type: spot_type,
        week_start,
        week_end: weekEndStr,
        title,
        description: description || null,
        url,
      },
    });
  } catch (error) {
    console.error('Error booking sponsored spot:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
