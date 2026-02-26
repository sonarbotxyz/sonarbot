import { NextRequest, NextResponse } from "next/server";
import { getPrivyClient } from "@/lib/privy";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const privy = getPrivyClient();
    const { userId } = await privy.verifyAuthToken(token);
    const user = await privy.getUser(userId);

    // Try Twitter
    const twitterAccount = user.linkedAccounts?.find(
      (a: { type: string }) => a.type === "twitter_oauth"
    ) as
      | { username?: string; name?: string; profilePictureUrl?: string }
      | undefined;

    if (twitterAccount?.username) {
      return NextResponse.json({
        privy_user_id: userId,
        handle: twitterAccount.username,
        name: twitterAccount.name || twitterAccount.username,
        avatar: twitterAccount.profilePictureUrl || null,
      });
    }

    // Try wallet
    const wallet = user.linkedAccounts?.find(
      (a: { type: string }) => a.type === "wallet"
    ) as { address?: string } | undefined;

    if (wallet?.address) {
      const short =
        wallet.address.slice(0, 6) + "..." + wallet.address.slice(-4);
      return NextResponse.json({
        privy_user_id: userId,
        handle: short,
        name: short,
        avatar: null,
        wallet_address: wallet.address,
      });
    }

    // Try email
    const email = user.linkedAccounts?.find(
      (a: { type: string }) => a.type === "email"
    ) as { address?: string } | undefined;

    if (email?.address) {
      return NextResponse.json({
        privy_user_id: userId,
        handle: email.address.split("@")[0],
        name: email.address.split("@")[0],
        avatar: null,
        email: email.address,
      });
    }

    return NextResponse.json(
      { error: "No linked account found" },
      { status: 400 }
    );
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
