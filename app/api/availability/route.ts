import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';
type ProductRow = { id:string; name:string; description:string; price_myr:number; image_url?:string|null };
type AvailabilityRow = { service_date_id:string; product_id:string; capacity:number; remaining:number; daily_remaining:number };

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const [{ data, error }, { data: windows, error: windowError }, { data: products, error: productError }, { data: productAvailability, error: availabilityError }] = await Promise.all([supabase
      .from('service_dates')
      .select('id, service_date, daily_capacity, booking_deadline')
      .eq('enabled', true)
      .gte('service_date', new Date().toISOString().slice(0, 10))
      .order('service_date', { ascending: true }), supabase.from('pickup_windows').select('id, service_date_id, starts_at, ends_at, capacity').eq('enabled', true).order('starts_at', { ascending: true }), supabase.from('products').select('id, name, description, price_myr, image_url').eq('active', true).order('created_at', { ascending: true }), supabase.rpc('get_service_date_product_availability')]);
    if (error) throw error; if (windowError) throw windowError; if (productError) throw productError; if (availabilityError) throw availabilityError;
    const productRows = (products ?? []) as ProductRow[];
    const availabilityRows = (productAvailability ?? []) as AvailabilityRow[];
    const now = Date.now();
    const dates = (data ?? [])
      .filter((date) => !date.booking_deadline || new Date(date.booking_deadline).getTime() > now)
      .map((date) => ({
        ...date,
        pickup_windows: (windows ?? []).filter((window) => window.service_date_id === date.id).map(({ service_date_id, ...window }) => window),
        products: availabilityRows.filter(item => item.service_date_id === date.id).map(item => {
          const product = productRows.find(candidate => candidate.id === item.product_id);
          return product ? { ...product, capacity: item.capacity, remaining: Math.min(item.remaining, item.daily_remaining) } : null;
        }).filter(Boolean),
        remaining: availabilityRows.find(item => item.service_date_id === date.id)?.daily_remaining ?? date.daily_capacity,
      }))
      .filter(date => date.products.length > 0 && date.remaining > 0);
    return NextResponse.json({ dates, products: productRows, timezone: 'Asia/Kuala_Lumpur' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('availability_error', error);
    return NextResponse.json({ error: 'Availability is temporarily unavailable' }, { status: 500 });
  }
}
