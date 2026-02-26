import { PrivyClient } from '@privy-io/server-auth';

let client: PrivyClient | null = null;

export function getPrivyClient(): PrivyClient {
  if (!client) {
    client = new PrivyClient(
      process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
      process.env.PRIVY_APP_SECRET!
    );
  }
  return client;
}

export interface PrivyAuthResult {
  handle: string;
  isAgent: false;
  avatar?: string;
}

/**
 * Verify a Privy auth token from the request.
 * Returns the user's Twitter handle + avatar if valid, null if not.
 */
export async function verifyPrivyToken(request: Request): Promise<PrivyAuthResult | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return null;

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token || token.startsWith('snr_')) return null;

  try {
    const privy = getPrivyClient();
    const { userId } = await privy.verifyAuthToken(token);
    const user = await privy.getUser(userId);

    const twitterAccount = user.linkedAccounts?.find(
      (a: { type: string }) => a.type === 'twitter_oauth'
    ) as { username?: string; profilePictureUrl?: string } | undefined;

    if (!twitterAccount?.username) return null;

    return {
      handle: twitterAccount.username,
      isAgent: false,
      avatar: twitterAccount.profilePictureUrl || undefined,
    };
  } catch {
    return null;
  }
}
