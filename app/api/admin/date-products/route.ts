import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';

type DateProductInput = { productId?: string; capacity?: number; enabled?: boolean };

export async function GET() {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const [{ data: products, error: productError }, { data: assignments, error: assignmentError }] = await Promise.all([
    supabase.from('products').select('id,name,active').order('created_at', { ascending: true }),
    supabase.from('service_date_products').select('service_date_id,product_id,capacity,enabled'),
  ]);
  if (productError || assignmentError) return NextResponse.json({ error: productError?.message ?? assignmentError?.message }, { status: 400 });
  return NextResponse.json({ products, assignments });
}

export async function PUT(request: NextRequest) {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  const serviceDateId = String(body.serviceDateId ?? '');
  const items: DateProductInput[] = Array.isArray(body.items) ? body.items : [];
  if (!serviceDateId || items.some(item => !item.productId || !Number.isInteger(Number(item.capacity)) || Number(item.capacity) < 1)) return NextResponse.json({ error: 'Valid date products and capacities are required' }, { status: 400 });
  const rows = items.map(item => ({ service_date_id: serviceDateId, product_id: String(item.productId), capacity: Number(item.capacity), enabled: Boolean(item.enabled) }));
  const { error } = await supabase.from('service_date_products').upsert(rows, { onConflict: 'service_date_id,product_id' });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ saved: true });
}
