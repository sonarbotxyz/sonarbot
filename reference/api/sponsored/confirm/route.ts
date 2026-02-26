import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { verifySpotPayment } from '@/lib/verifySpotPayment';
import { checkTxAlreadyUsed, verifyTxFreshness } from '@/lib/txValidation';

// POST /api/sponsored/confirm — Verify payment and activate a spot
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
    const { booking_id, tx_hash } = body;

    if (!booking_id || !tx_hash) {
      return NextResponse.json(
        { error: 'Missing required fields: booking_id, tx_hash' },
        { status: 400 }
      );
    }

    const cleanTxHash = tx_hash.startsWith('0x') ? tx_hash : `0x${tx_hash}`;

    // Check if tx_hash already used across ALL payment types
    const alreadyUsed = await checkTxAlreadyUsed(cleanTxHash);
    if (alreadyUsed) {
      return NextResponse.json(
        { error: alreadyUsed },
        { status: 409 }
      );
    }

    // Verify transaction is fresh (max 10 minutes old)
    const freshness = await verifyTxFreshness(cleanTxHash, 600);
    if (!freshness.fresh) {
      return NextResponse.json(
        { error: freshness.error },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Find the booking
    const { data: spot, error: fetchError } = await supabase
      .from('sponsored_spots')
      .select('*')
      .eq('id', booking_id)
      .single();

    if (fetchError || !spot) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Verify it belongs to the authed user
    if (spot.booked_by !== auth.handle) {
      return NextResponse.json({ error: 'This booking does not belong to you' }, { status: 403 });
    }

    // Check if already active
    if (spot.status === 'active') {
      return NextResponse.json({ error: 'This booking is already active' }, { status: 400 });
    }

    // Check hold hasn't expired
    if (spot.status === 'held' && spot.hold_expires_at) {
      const now = new Date();
      const holdExpires = new Date(spot.hold_expires_at);
      if (now > holdExpires) {
        // Clean up expired hold
        await supabase
          .from('sponsored_spots')
          .delete()
          .eq('id', booking_id);
        return NextResponse.json({ error: 'Hold has expired. Please book again.' }, { status: 410 });
      }
    }

    // Verify payment onchain
    const paymentToken = spot.payment_token as 'USDC' | 'SNR';
    const expectedAmount = Number(spot.payment_amount);

    const verification = await verifySpotPayment(cleanTxHash, paymentToken, expectedAmount);

    if (!verification.valid) {
      return NextResponse.json(
        { error: `Payment verification failed: ${verification.error}` },
        { status: 400 }
      );
    }

    // Activate the spot
    const { data: updatedSpot, error: updateError } = await supabase
      .from('sponsored_spots')
      .update({
        status: 'active',
        active: true,
        tx_hash: cleanTxHash,
        usdc_paid: paymentToken === 'USDC' ? expectedAmount : 0,
        hold_expires_at: null,
      })
      .eq('id', booking_id)
      .select('id, spot_type, week_start, week_end, title, description, url, status')
      .single();

    if (updateError || !updatedSpot) {
      console.error('Error activating spot:', updateError);
      return NextResponse.json({ error: 'Failed to activate spot' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      spot: {
        id: updatedSpot.id,
        type: updatedSpot.spot_type,
        week_start: updatedSpot.week_start,
        week_end: updatedSpot.week_end,
        title: updatedSpot.title,
        description: updatedSpot.description,
        url: updatedSpot.url,
        status: updatedSpot.status,
      },
    });
  } catch (error) {
    console.error('Error confirming sponsored spot:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
