import { getSupabase } from './db';

interface RateLimitResult {
  allowed: boolean;
  limit?: string;
  upgrade?: string;
}

/**
 * Check if user has premium subscription that hasn't expired
 */
async function hasValidPremiumSubscription(handle: string): Promise<boolean> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('api_keys')
    .select('subscription_tier, subscription_expires')
    .eq('twitter_handle', handle)
    .single();
    
  if (error || !data) return false;
  
  if (data.subscription_tier === 'premium' && data.subscription_expires) {
    return new Date(data.subscription_expires) > new Date();
  }
  
  return false;
}

/**
 * Count usage for a specific action type within a time period
 */
async function countUsage(
  handle: string, 
  actionType: string, 
  hoursAgo: number
): Promise<number> {
  const supabase = getSupabase();
  const cutoffTime = new Date();
  cutoffTime.setHours(cutoffTime.getHours() - hoursAgo);
  
  const { data, error } = await supabase
    .from('usage_tracking')
    .select('id', { count: 'exact' })
    .eq('twitter_handle', handle)
    .eq('action_type', actionType)
    .gte('created_at', cutoffTime.toISOString());
    
  if (error) {
    console.error('Error counting usage:', error);
    return 0;
  }
  
  return data?.length || 0;
}

/**
 * Record usage for rate limiting tracking
 */
async function recordUsage(handle: string, actionType: string): Promise<void> {
  const supabase = getSupabase();
  
  await supabase
    .from('usage_tracking')
    .insert({
      twitter_handle: handle,
      action_type: actionType
    });
}

/**
 * Check submission limit: 1 per week for free, unlimited for premium
 */
export async function checkSubmissionLimit(handle: string): Promise<RateLimitResult> {
  // Check premium subscription first
  if (await hasValidPremiumSubscription(handle)) {
    await recordUsage(handle, 'submission');
    return { allowed: true };
  }
  
  // Check free tier limit: 1 submission per week (168 hours)
  const weeklySubmissions = await countUsage(handle, 'submission', 168);
  
  if (weeklySubmissions >= 1) {
    return {
      allowed: false,
      limit: '1 submission per week',
      upgrade: '/subscribe'
    };
  }
  
  await recordUsage(handle, 'submission');
  return { allowed: true };
}

/**
 * Check upvote limit: 2 per day for free, unlimited for premium
 */
export async function checkUpvoteLimit(handle: string): Promise<RateLimitResult> {
  // Check premium subscription first
  if (await hasValidPremiumSubscription(handle)) {
    await recordUsage(handle, 'upvote');
    return { allowed: true };
  }
  
  // Check free tier limit: 2 upvotes per day (24 hours)
  const dailyUpvotes = await countUsage(handle, 'upvote', 24);
  
  if (dailyUpvotes >= 2) {
    return {
      allowed: false,
      limit: '2 upvotes per day',
      upgrade: '/subscribe'
    };
  }
  
  await recordUsage(handle, 'upvote');
  return { allowed: true };
}

/**
 * Check comment limit: 2 per day for free, unlimited for premium
 */
export async function checkCommentLimit(handle: string): Promise<RateLimitResult> {
  // Check premium subscription first
  if (await hasValidPremiumSubscription(handle)) {
    await recordUsage(handle, 'comment');
    return { allowed: true };
  }
  
  // Check free tier limit: 2 comments per day (24 hours)
  const dailyComments = await countUsage(handle, 'comment', 24);
  
  if (dailyComments >= 2) {
    return {
      allowed: false,
      limit: '2 comments per day',
      upgrade: '/subscribe'
    };
  }
  
  await recordUsage(handle, 'comment');
  return { allowed: true };
}