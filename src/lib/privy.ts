import { PrivyClient } from "@privy-io/server-auth";

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
  privyUserId: string;
  handle: string;
  avatar?: string;
}

/**
 * Verify a Privy auth token from the request.
 * Returns user info if valid, null if not.
 */
export async function verifyPrivyToken(
  request: Request
): Promise<PrivyAuthResult | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) return null;

  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token || token.startsWith("snr_")) return null;

  try {
    const privy = getPrivyClient();
    const { userId } = await privy.verifyAuthToken(token);
    const user = await privy.getUser(userId);

    // Try Twitter first
    const twitterAccount = user.linkedAccounts?.find(
      (a: { type: string }) => a.type === "twitter_oauth"
    ) as
      | { username?: string; profilePictureUrl?: string }
      | undefined;

    if (twitterAccount?.username) {
      return {
        privyUserId: userId,
        handle: twitterAccount.username,
        avatar: twitterAccount.profilePictureUrl || undefined,
      };
    }

    // Fall back to wallet address
    const wallet = user.linkedAccounts?.find(
      (a: { type: string }) => a.type === "wallet"
    ) as { address?: string } | undefined;

    if (wallet?.address) {
      return {
        privyUserId: userId,
        handle: wallet.address.slice(0, 6) + "..." + wallet.address.slice(-4),
        avatar: undefined,
      };
    }

    // Fall back to email
    const email = user.linkedAccounts?.find(
      (a: { type: string }) => a.type === "email"
    ) as { address?: string } | undefined;

    if (email?.address) {
      return {
        privyUserId: userId,
        handle: email.address.split("@")[0],
        avatar: undefined,
      };
    }

    return null;
  } catch {
    return null;
  }
}
