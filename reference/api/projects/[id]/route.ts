import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db';
import { isValidUUID, sanitizeText } from '@/lib/validate';
import { validateApiKey } from '@/lib/auth';

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

const UPDATABLE_TEXT_FIELDS = [
  'name',
  'tagline',
  'description',
  'website_url',
  'demo_url',
  'github_url',
  'logo_url',
  'twitter_handle',
] as const;

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
      .from('projects')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw new Error(error.message);
    if (!data) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    return NextResponse.json({ project: data });
  } catch (error) {
    console.error('Failed to fetch project:', error);
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    // Validate API key
    const authedHandle = await validateApiKey(request);
    if (!authedHandle) {
      return NextResponse.json(
        { error: 'Valid API key required.' },
        { status: 401 }
      );
    }

    const supabase = getSupabase();

    // Fetch existing project
    const { data: existing, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) throw new Error(fetchError.message);
    if (!existing) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Only original submitter can update
    if (existing.submitted_by_twitter !== authedHandle.replace(/^@/, '')) {
      return NextResponse.json(
        { error: 'Only the original submitter can update this project' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updates: Record<string, string> = {};

    // Sanitize text fields
    for (const field of UPDATABLE_TEXT_FIELDS) {
      if (body[field] !== undefined) {
        updates[field] = sanitizeText(String(body[field]));
      }
    }

    // Clean twitter_handle if provided
    if (updates.twitter_handle) {
      updates.twitter_handle = updates.twitter_handle.replace(/^@/, '');
    }

    // Validate category if provided
    if (body.category !== undefined) {
      const category = String(body.category);
      if (!VALID_CATEGORIES.includes(category)) {
        return NextResponse.json(
          { error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` },
          { status: 400 }
        );
      }
      updates.category = category;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Database error:', updateError);
      return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      project: updated,
      message: 'Project updated successfully'
    });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
