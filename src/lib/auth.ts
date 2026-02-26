import { getSupabase } from "./supabase";
import { verifyPrivyToken } from "./privy";

export interface AuthResult {
  userId: string;
  handle: string;
  isAgent: boolean;
  avatar?: string;
}

/**
 * Validate an API key from the Authorization header.
 * Returns the twitter_handle if valid, null if not.
 */
export async function validateApiKey(
  request: Request
): Promise<string | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) return null;

  const key = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!key || !key.startsWith("snr_")) return null;

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("api_keys")
    .select("twitter_handle, revoked")
    .eq("api_key", key)
    .single();

  if (error || !data || data.revoked) return null;
  return data.twitter_handle;
}

/**
 * Unified auth: tries API key first (agent), then Privy token (human).
 */
export async function authenticateRequest(
  request: Request
): Promise<AuthResult | null> {
  // Try API key first (agents)
  const agentHandle = await validateApiKey(request);
  if (agentHandle) {
    return { userId: agentHandle, handle: agentHandle, isAgent: true };
  }

  // Try Privy token (humans)
  const privyResult = await verifyPrivyToken(request);
  if (privyResult) {
    return {
      userId: privyResult.privyUserId,
      handle: privyResult.handle,
      isAgent: false,
      avatar: privyResult.avatar,
    };
  }

  return null;
}
