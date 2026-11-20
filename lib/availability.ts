import { getSupabaseAdmin } from '@/lib/supabase-admin';

export type Product = {
  id: string;
  name: string;
  description: string;
  price_myr: number;
  image_url?: string | null;
};

export type DateProduct = Product & {
  capacity: number;
  remaining: number;
};

export type PickupWindow = {
  id: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
};

export type ServiceDate = {
  id: string;
  service_date: string;
  daily_capacity: number;
  booking_deadline?: string | null;
  pickup_windows: PickupWindow[];
  products: DateProduct[];
  remaining: number;
};

export type AvailabilityData = {
  dates: ServiceDate[];
  products: Product[];
  timezone: 'Asia/Kuala_Lumpur';
};

type AvailabilityRow = {
  service_date_id: string;
  product_id: string;
  capacity: number;
  remaining: number;
  daily_remaining: number;
};

export async function getAvailability(): Promise<AvailabilityData> {
  const supabase = getSupabaseAdmin();
  const today = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Kuala_Lumpur',
  }).format(new Date());

  const [
    { data: serviceDates, error: serviceDateError },
    { data: windows, error: windowError },
    { data: products, error: productError },
    { data: productAvailability, error: availabilityError },
  ] = await Promise.all([
    supabase
      .from('service_dates')
      .select('id, service_date, daily_capacity, booking_deadline')
      .eq('enabled', true)
      .gte('service_date', today)
      .order('service_date', { ascending: true }),
    supabase
      .from('pickup_windows')
      .select('id, service_date_id, starts_at, ends_at, capacity')
      .eq('enabled', true)
      .order('starts_at', { ascending: true }),
    supabase
      .from('products')
      .select('id, name, description, price_myr, image_url')
      .eq('active', true)
      .order('created_at', { ascending: true }),
    supabase.rpc('get_service_date_product_availability'),
  ]);

  if (serviceDateError) throw serviceDateError;
  if (windowError) throw windowError;
  if (productError) throw productError;
  if (availabilityError) throw availabilityError;

  const productRows = (products ?? []) as Product[];
  const availabilityRows = (productAvailability ?? []) as AvailabilityRow[];
  const now = Date.now();
  const dates = (serviceDates ?? [])
    .filter(date => !date.booking_deadline || new Date(date.booking_deadline).getTime() > now)
    .map(date => ({
      ...date,
      pickup_windows: (windows ?? [])
        .filter(window => window.service_date_id === date.id)
        .map(({ service_date_id: _serviceDateId, ...window }) => window),
      products: availabilityRows
        .filter(item => item.service_date_id === date.id)
        .map(item => {
          const product = productRows.find(candidate => candidate.id === item.product_id);
          return product ? {
            ...product,
            capacity: item.capacity,
            remaining: Math.min(item.remaining, item.daily_remaining),
          } : null;
        })
        .filter((product): product is DateProduct => product !== null),
      remaining: availabilityRows.find(item => item.service_date_id === date.id)?.daily_remaining ?? date.daily_capacity,
    }))
    .filter(date => date.products.length > 0 && date.remaining > 0);

  return { dates, products: productRows, timezone: 'Asia/Kuala_Lumpur' };
}
