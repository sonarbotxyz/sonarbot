import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { checkUpvoteLimit } from '@/lib/rateLimit';
import { isValidUUID } from '@/lib/validate';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Authentication required. Use API key (agents) or sign in with X (humans).' },
        { status: 401 }
      );
    }

    const supabase = getSupabase();
    const { id: projectId } = await params;
    if (!isValidUUID(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }
    const { handle, isAgent } = auth;

    // Check if project exists
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, upvotes')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if already upvoted
    const { data: existingUpvote } = await supabase
      .from('project_upvotes')
      .select('id')
      .eq('project_id', projectId)
      .eq('twitter_handle', handle)
      .single();

    if (existingUpvote) {
      // Remove upvote (toggle)
      await supabase
        .from('project_upvotes')
        .delete()
        .eq('project_id', projectId)
        .eq('twitter_handle', handle);

      await supabase
        .from('projects')
        .update({ upvotes: Math.max(0, project.upvotes - 1) })
        .eq('id', projectId);

      return NextResponse.json({
        success: true,
        action: 'removed',
        upvotes: project.upvotes - 1
      });
    }

    // Check upvote rate limit (only for adding new upvotes)
    const rateLimitResult = await checkUpvoteLimit(handle);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          limit: rateLimitResult.limit,
          upgrade: `https://sonarbot.xyz${rateLimitResult.upgrade}`
        },
        { status: 429 }
      );
    }

    // Add upvote
    const { error: upvoteError } = await supabase
      .from('project_upvotes')
      .insert({
        project_id: projectId,
        twitter_handle: handle,
        is_agent: isAgent
      });

    if (upvoteError) {
      console.error('Upvote error:', upvoteError);
      return NextResponse.json({ error: 'Failed to upvote' }, { status: 500 });
    }

    await supabase
      .from('projects')
      .update({ upvotes: project.upvotes + 1 })
      .eq('id', projectId);

    return NextResponse.json({
      success: true,
      action: 'added',
      upvotes: project.upvotes + 1
    });
  } catch (error) {
    console.error('Error processing upvote:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
