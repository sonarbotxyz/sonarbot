import { NextRequest, NextResponse } from 'next/server';
import { getPrivyClient } from '@/lib/privy';

/**
 * GET /api/auth/me — returns the current user's Twitter handle from their Privy token.
 * Frontend sends the Privy auth token in the Authorization header.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const privy = getPrivyClient();
    const { userId } = await privy.verifyAuthToken(token);
    const user = await privy.getUser(userId);

    const twitterAccount = user.linkedAccounts?.find(
      (a: { type: string }) => a.type === 'twitter_oauth'
    ) as { username?: string; name?: string; profilePictureUrl?: string } | undefined;

    if (!twitterAccount?.username) {
      return NextResponse.json({ error: 'No Twitter account linked' }, { status: 400 });
    }

    return NextResponse.json({
      twitter_handle: twitterAccount.username,
      name: twitterAccount.name || twitterAccount.username,
      avatar: twitterAccount.profilePictureUrl || null,
    });
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
