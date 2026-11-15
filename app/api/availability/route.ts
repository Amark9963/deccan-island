import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const [{ data, error }, { data: products, error: productError }] = await Promise.all([supabase
      .from('service_dates')
      .select('id, service_date, daily_capacity, booking_deadline, pickup_windows(id, starts_at, ends_at, capacity)')
      .eq('enabled', true)
      .gte('service_date', new Date().toISOString().slice(0, 10))
      .order('service_date', { ascending: true }), supabase.from('products').select('id, name, price_myr').eq('active', true).order('created_at', { ascending: true }).limit(1)]);
    if (error) throw error; if (productError) throw productError;
    return NextResponse.json({ dates: (data ?? []).map((date) => ({ ...date, products: products ?? [] })), timezone: 'Asia/Kuala_Lumpur' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('availability_error', error);
    return NextResponse.json({ error: 'Availability is temporarily unavailable' }, { status: 500 });
  }
}
