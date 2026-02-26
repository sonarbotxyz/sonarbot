import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db';
import { generateApiKey } from '@/lib/auth';
import { isValidHandle } from '@/lib/validate';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { twitter_handle } = body;

    if (!twitter_handle || typeof twitter_handle !== 'string') {
      return NextResponse.json(
        { error: 'twitter_handle is required' },
        { status: 400 }
      );
    }

    const handle = twitter_handle.replace(/^@/, '').trim().toLowerCase();
    if (!handle || !isValidHandle(handle)) {
      return NextResponse.json(
        { error: 'Invalid twitter_handle. Only letters, numbers, and underscores (max 30 chars).' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Check if already registered — NEVER return the existing key
    const { data: existing } = await supabase
      .from('api_keys')
      .select('twitter_handle, revoked')
      .eq('twitter_handle', handle)
      .single();

    if (existing && !existing.revoked) {
      return NextResponse.json({
        twitter_handle: handle,
        message: 'Already registered. If you lost your API key, contact @sonarbotxyz on X to request a reset.'
      });
    }

    // Generate new key
    const api_key = generateApiKey();

    const { error } = await supabase
      .from('api_keys')
      .upsert({
        twitter_handle: handle,
        api_key,
        revoked: false
      }, { onConflict: 'twitter_handle' });

    if (error) {
      return NextResponse.json(
        { error: 'Registration failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      twitter_handle: handle,
      api_key,
      message: 'Registered! Save this key — it will NOT be shown again. Use it in Authorization: Bearer <key> header for all write operations.'
    });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
