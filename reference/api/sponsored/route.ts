import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db';

// GET /api/sponsored - Get active sponsored spots by type
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const spotType = searchParams.get('type');

    if (!spotType) {
      return NextResponse.json(
        { error: 'type parameter is required (e.g., ?type=homepage_inline)' },
        { status: 400 }
      );
    }

    const validSpotTypes = ['homepage_inline', 'homepage_banner', 'project_sidebar'];
    if (!validSpotTypes.includes(spotType)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validSpotTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    // Try new schema first: status='active' + week_start/week_end
    let activeSpot = null;
    try {
      const { data: newSpots, error: newError } = await supabase
        .from('sponsored_spots')
        .select('*')
        .eq('spot_type', spotType)
        .eq('status', 'active')
        .lte('week_start', todayStr)
        .gte('week_end', todayStr)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!newError && newSpots && newSpots.length > 0) {
        activeSpot = newSpots[0];
      }
    } catch (e) {
      console.error('Error fetching new-schema spots:', e);
    }

    // Fallback: old schema with starts_at/ends_at + active boolean
    if (!activeSpot) {
      try {
        const nowIso = now.toISOString();
        const { data: oldSpots, error: oldError } = await supabase
          .from('sponsored_spots')
          .select('*')
          .eq('spot_type', spotType)
          .eq('active', true)
          .lte('starts_at', nowIso)
          .gte('ends_at', nowIso)
          .order('created_at', { ascending: false })
          .limit(1);

        if (!oldError && oldSpots && oldSpots.length > 0) {
          activeSpot = oldSpots[0];
        }
      } catch (e) {
        console.error('Error fetching old-schema spots:', e);
      }
    }

    return NextResponse.json({
      active_spot: activeSpot,
      count: activeSpot ? 1 : 0
    });
  } catch (error) {
    console.error('Error fetching sponsored spots:', error);
    return NextResponse.json({
      active_spot: null,
      count: 0
    });
  }
}
