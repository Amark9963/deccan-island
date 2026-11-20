import { NextResponse } from 'next/server';
import { getAvailability } from '@/lib/availability';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json(await getAvailability(), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('availability_error', error);
    return NextResponse.json({ error: 'Availability is temporarily unavailable' }, { status: 500 });
  }
}
