import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db';
import { validateApiKey } from '@/lib/auth';
import { checkSubmissionLimit } from '@/lib/rateLimit';
import { sanitizeText, clampInt } from '@/lib/validate';

interface ProjectSubmission {
  name: string;
  tagline: string;
  description?: string;
  website_url?: string;
  demo_url?: string;
  github_url?: string;
  logo_url?: string;
  twitter_handle?: string;
  category?: string;
  submitted_by_twitter: string;
}

const VALID_CATEGORIES = [
  'defi',
  'agents',
  'infrastructure',
  'consumer',
  'gaming',
  'social',
  'tools',
  'other'
];

// GET - List projects
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const sort = searchParams.get('sort') || 'newest'; // newest, upvotes, trending
    const limit = clampInt(searchParams.get('limit'), 50, 1, 100);
    const offset = clampInt(searchParams.get('offset'), 0, 0, 10000);

    let query = supabase
      .from('projects')
      .select('*')
      .eq('is_approved', true);

    // Filter by category
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    // Sort
    if (sort === 'upvotes') {
      query = query.order('upvotes', { ascending: false });
    } else if (sort === 'trending') {
      // Trending = upvotes weighted by recency
      query = query.order('upvotes', { ascending: false })
                   .order('created_at', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: projects, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }

    return NextResponse.json({
      projects: projects || [],
      count: projects?.length || 0
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Submit a new project (requires API key)
export async function POST(request: NextRequest) {
  try {
    // Validate API key
    const authedHandle = await validateApiKey(request);
    if (!authedHandle) {
      return NextResponse.json(
        { error: 'Valid API key required. Register at POST /api/register with your twitter_handle.' },
        { status: 401 }
      );
    }

    // Check submission rate limit
    const rateLimitResult = await checkSubmissionLimit(authedHandle);
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

    const supabase = getSupabase();
    const body: ProjectSubmission = await request.json();

    // Use the authenticated handle as submitted_by_twitter
    body.submitted_by_twitter = authedHandle;

    // Sanitize and validate required fields
    body.name = body.name ? sanitizeText(body.name) : '';
    body.tagline = body.tagline ? sanitizeText(body.tagline) : '';
    if (body.description) body.description = sanitizeText(body.description);

    if (!body.name || !body.tagline) {
      return NextResponse.json(
        { error: 'name and tagline are required' },
        { status: 400 }
      );
    }

    // Validate category
    const category = body.category || 'other';
    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` },
        { status: 400 }
      );
    }

    // Clean twitter handle
    const submitterHandle = body.submitted_by_twitter.replace(/^@/, '');

    // Check for duplicate (same name from same submitter)
    const { data: existing } = await supabase
      .from('projects')
      .select('id')
      .eq('name', body.name)
      .eq('submitted_by_twitter', submitterHandle)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'You have already submitted this project' },
        { status: 409 }
      );
    }

    // Insert project
    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        name: body.name,
        tagline: body.tagline,
        description: body.description || '',
        website_url: body.website_url,
        demo_url: body.demo_url,
        github_url: body.github_url,
        logo_url: body.logo_url,
        twitter_handle: body.twitter_handle?.replace(/^@/, ''),
        category: category,
        submitted_by_twitter: submitterHandle,
        upvotes: 0,
        is_approved: true // Auto-approve for now
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to submit project' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      project: project,
      message: 'Project submitted successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error submitting project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
