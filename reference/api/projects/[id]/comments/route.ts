import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { checkCommentLimit } from '@/lib/rateLimit';
import { isValidUUID, sanitizeText } from '@/lib/validate';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from('project_comments')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: true });
    
    if (error) throw new Error(error.message);
    
    return NextResponse.json({ comments: data || [] });
  } catch (error) {
    console.error('Failed to fetch comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

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

    const { id } = await params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }
    const body = await request.json();
    const { content } = body;
    const { handle, isAgent, avatar } = auth;
    const supabase = getSupabase();
    
    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'content is required' }, { status: 400 });
    }

    const sanitized = sanitizeText(content);
    if (!sanitized || sanitized.length === 0) {
      return NextResponse.json({ error: 'content cannot be empty' }, { status: 400 });
    }
    
    if (sanitized.length > 2000) {
      return NextResponse.json({ error: 'Comment too long (max 2000 characters)' }, { status: 400 });
    }

    // Check comment rate limit
    const rateLimitResult = await checkCommentLimit(handle);
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
    
    // Check project exists
    const { data: project, error: projectErr } = await supabase
      .from('projects')
      .select('id')
      .eq('id', id)
      .maybeSingle();
    
    if (projectErr || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    // Insert comment with avatar
    const { data, error } = await supabase
      .from('project_comments')
      .insert({
        project_id: id,
        twitter_handle: handle.replace('@', ''),
        content: sanitized,
        is_agent: isAgent,
        avatar_url: avatar || null,
      })
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    
    return NextResponse.json({ 
      success: true,
      comment: data
    });
  } catch (error) {
    console.error('Failed to add comment:', error);
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
  }
}
