import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const [{ data, error }, { data: windows, error: windowError }, { data: products, error: productError }] = await Promise.all([supabase
      .from('service_dates')
      .select('id, service_date, daily_capacity, booking_deadline')
      .eq('enabled', true)
      .gte('service_date', new Date().toISOString().slice(0, 10))
      .order('service_date', { ascending: true }), supabase.from('pickup_windows').select('id, service_date_id, starts_at, ends_at, capacity').eq('enabled', true).order('starts_at', { ascending: true }), supabase.from('products').select('id, name, description, price_myr').eq('active', true).order('created_at', { ascending: true })]);
    if (error) throw error; if (windowError) throw windowError; if (productError) throw productError;
    return NextResponse.json({ dates: (data ?? []).map((date) => ({ ...date, pickup_windows: (windows ?? []).filter((window) => window.service_date_id === date.id).map(({ service_date_id, ...window }) => window), products: products ?? [] })), timezone: 'Asia/Kuala_Lumpur' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('availability_error', error);
    return NextResponse.json({ error: 'Availability is temporarily unavailable' }, { status: 500 });
  }
}
