import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db';

// GET /api/admin/sponsored - List all sponsored spots (admin only)
export async function GET(request: NextRequest) {
  try {
    // Check admin API key
    const adminKey = process.env.ADMIN_API_KEY;
    const authHeader = request.headers.get('Authorization');
    const providedKey = authHeader?.replace(/^Bearer\s+/i, '').trim();

    if (!adminKey || !providedKey || providedKey !== adminKey) {
      return NextResponse.json(
        { error: 'Admin API key required' },
        { status: 401 }
      );
    }

    const supabase = getSupabase();
    
    const { data: spots, error } = await supabase
      .from('sponsored_spots')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch sponsored spots' }, { status: 500 });
    }

    return NextResponse.json({
      sponsored_spots: spots || []
    });
  } catch (error) {
    console.error('Error fetching sponsored spots:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/sponsored - Create new sponsored spot (admin only)
export async function POST(request: NextRequest) {
  try {
    // Check admin API key
    const adminKey = process.env.ADMIN_API_KEY;
    const authHeader = request.headers.get('Authorization');
    const providedKey = authHeader?.replace(/^Bearer\s+/i, '').trim();

    if (!adminKey || !providedKey || providedKey !== adminKey) {
      return NextResponse.json(
        { error: 'Admin API key required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      spot_type, 
      advertiser, 
      title, 
      description, 
      url, 
      image_url, 
      usdc_paid, 
      starts_at, 
      ends_at 
    } = body;

    // Validate required fields
    if (!spot_type || !advertiser || !title || !url || !usdc_paid || !starts_at || !ends_at) {
      return NextResponse.json(
        { error: 'Required fields: spot_type, advertiser, title, url, usdc_paid, starts_at, ends_at' },
        { status: 400 }
      );
    }

    // Validate spot_type
    const validSpotTypes = ['homepage_banner', 'product_sidebar'];
    if (!validSpotTypes.includes(spot_type)) {
      return NextResponse.json(
        { error: `Invalid spot_type. Must be one of: ${validSpotTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate dates
    const startDate = new Date(starts_at);
    const endDate = new Date(ends_at);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format for starts_at or ends_at' },
        { status: 400 }
      );
    }

    if (endDate <= startDate) {
      return NextResponse.json(
        { error: 'ends_at must be after starts_at' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    
    // Insert sponsored spot
    const { data: spot, error } = await supabase
      .from('sponsored_spots')
      .insert({
        spot_type,
        advertiser,
        title,
        description,
        url,
        image_url,
        usdc_paid: Number(usdc_paid),
        starts_at: startDate.toISOString(),
        ends_at: endDate.toISOString(),
        active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to create sponsored spot' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      sponsored_spot: spot,
      message: 'Sponsored spot created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating sponsored spot:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}