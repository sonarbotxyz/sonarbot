import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { verifyPayment } from '@/lib/verifyPayment';
import { checkTxAlreadyUsed, verifyTxFreshness } from '@/lib/txValidation';

// POST - Confirm subscription payment
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
    const { tx_hash } = body;
    const { handle } = auth;

    if (!tx_hash) {
      return NextResponse.json(
        { error: 'tx_hash is required' },
        { status: 400 }
      );
    }

    // Clean up tx hash format
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

    // Insert pending payment record
    const { error: insertError } = await supabase
      .from('subscription_payments')
      .insert({
        twitter_handle: handle,
        tx_hash: cleanTxHash,
        amount: 0, // Will be updated after verification
        status: 'pending'
      });

    if (insertError) {
      console.error('Failed to insert payment record:', insertError);
      return NextResponse.json(
        { error: 'Failed to record payment' },
        { status: 500 }
      );
    }

    // Verify payment onchain
    const verificationResult = await verifyPayment(cleanTxHash);

    if (!verificationResult.valid) {
      // Update payment status to failed
      await supabase
        .from('subscription_payments')
        .update({ 
          status: 'failed',
          verified_at: new Date().toISOString()
        })
        .eq('tx_hash', cleanTxHash);

      return NextResponse.json(
        {
          error: 'Payment verification failed',
          details: verificationResult.error
        },
        { status: 400 }
      );
    }

    // Payment verified! Update records
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30); // 30 days from now

    // Update payment record
    await supabase
      .from('subscription_payments')
      .update({
        amount: parseFloat(verificationResult.amount!),
        status: 'verified',
        verified_at: new Date().toISOString()
      })
      .eq('tx_hash', cleanTxHash);

    // Update api_keys subscription
    const { error: updateError } = await supabase
      .from('api_keys')
      .update({
        subscription_tier: 'premium',
        subscription_expires: expiryDate.toISOString()
      })
      .eq('twitter_handle', handle);

    if (updateError) {
      console.error('Failed to update subscription:', updateError);
      return NextResponse.json(
        { error: 'Payment verified but failed to activate subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'active',
      expires: expiryDate.toISOString(),
      amount_paid: verificationResult.amount,
      usd_value: verificationResult.usdValue,
      from_address: verificationResult.from
    });

  } catch (error) {
    console.error('Error confirming payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
