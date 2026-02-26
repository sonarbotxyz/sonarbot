import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db';

const SLOT_TYPES = [
  {
    type: 'homepage_inline',
    label: 'Homepage — Featured after #3 product',
    price_usd: 299,
    price_snr_discount: '20%',
  },
  {
    type: 'project_sidebar',
    label: 'Product Detail — Sidebar ad',
    price_usd: 149,
    price_snr_discount: '20%',
  },
];

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// GET /api/sponsored/slots — Public, no auth needed
export async function GET() {
  try {
    const supabase = getSupabase();
    const now = new Date();
    const currentMonday = getMonday(now);

    // Generate 5 weeks: current + next 4
    const weeks: { week_start: string; week_end: string }[] = [];
    for (let i = 0; i < 5; i++) {
      const start = new Date(currentMonday);
      start.setDate(start.getDate() + i * 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      weeks.push({ week_start: formatDate(start), week_end: formatDate(end) });
    }

    // Fetch all booked/active spots for these weeks
    const weekStarts = weeks.map(w => w.week_start);
    let bookedSpots: { spot_type: string; week_start: string; status: string; advertiser: string; title: string; hold_expires_at: string | null }[] = [];
    try {
      const { data, error } = await supabase
        .from('sponsored_spots')
        .select('spot_type, week_start, status, advertiser, title, hold_expires_at')
        .in('week_start', weekStarts)
        .in('status', ['active', 'held']);

      if (error) {
        console.error('Database error fetching slots:', error);
      } else if (data) {
        bookedSpots = data;
      }
    } catch (e) {
      console.error('Error fetching sponsored slots:', e);
    }

    const nowIso = now.toISOString();

    const slots = SLOT_TYPES.map(slot => ({
      ...slot,
      weeks: weeks.map(week => {
        const match = bookedSpots.find(
          b => b.spot_type === slot.type && b.week_start === week.week_start
        );

        if (match) {
          // If it's a hold that's expired, treat as available
          if (match.status === 'held' && match.hold_expires_at && match.hold_expires_at < nowIso) {
            return { ...week, status: 'available' };
          }
          if (match.status === 'active') {
            return { ...week, status: 'booked' as const, advertiser: match.title || match.advertiser };
          }
          if (match.status === 'held') {
            return { ...week, status: 'held' as const };
          }
        }

        return { ...week, status: 'available' as const };
      }),
    }));

    return NextResponse.json({ slots });
  } catch (error) {
    console.error('Error in sponsored slots:', error);
    return NextResponse.json({ slots: [] });
  }
}
