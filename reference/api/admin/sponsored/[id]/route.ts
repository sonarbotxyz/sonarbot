import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db';

// DELETE /api/admin/sponsored/[id] - Deactivate sponsored spot (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const supabase = getSupabase();
    
    // Check if sponsored spot exists
    const { data: existingSpot, error: fetchError } = await supabase
      .from('sponsored_spots')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingSpot) {
      return NextResponse.json(
        { error: 'Sponsored spot not found' },
        { status: 404 }
      );
    }

    // Deactivate the spot (set active = false)
    const { error: updateError } = await supabase
      .from('sponsored_spots')
      .update({ active: false })
      .eq('id', id);

    if (updateError) {
      console.error('Database error:', updateError);
      return NextResponse.json({ error: 'Failed to deactivate sponsored spot' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Sponsored spot deactivated successfully'
    });
  } catch (error) {
    console.error('Error deactivating sponsored spot:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}