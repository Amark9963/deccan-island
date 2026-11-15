import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export async function POST(request: NextRequest) {
  if (process.env.ENABLE_LIVE_ORDERS !== 'true') return json({ error: 'Live ordering is not enabled yet' }, 503);
  try {
    const body = await request.json();
    const productId = String(body.productId ?? '');
    const serviceDateId = String(body.serviceDateId ?? '');
    const pickupWindowId = String(body.pickupWindowId ?? '');
    const customerName = String(body.customerName ?? '').trim();
    const whatsappPhone = String(body.whatsappPhone ?? '').trim();
    const fulfillmentType = body.fulfillmentType === 'delivery' ? 'delivery' : 'pickup';
    const deliveryAddress = String(body.deliveryAddress ?? '').trim();
    const deliveryPostcode = String(body.deliveryPostcode ?? '').trim();
    const deliveryNotes = String(body.deliveryNotes ?? '').trim();
    const quantity = Number(body.quantity);
    if (!productId || !serviceDateId || !pickupWindowId || !customerName || !whatsappPhone || !Number.isInteger(quantity) || quantity < 1 || quantity > 15 || (fulfillmentType === 'delivery' && (!deliveryAddress || !deliveryPostcode))) {
      return json({ error: 'Please provide valid order details' }, 400);
    }

    const idempotencyHeader = request.headers.get('idempotency-key');
    const idempotencyKey = idempotencyHeader || randomUUID();
    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const paymentMinutes = Number(process.env.PAYMENT_RESERVATION_MINUTES ?? 30);
    const paymentDeadline = new Date(Date.now() + Math.min(Math.max(paymentMinutes, 5), 60) * 60_000).toISOString();
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.rpc('create_order_reservation', {
      p_idempotency_key: idempotencyKey,
      p_product_id: productId,
      p_service_date_id: serviceDateId,
      p_pickup_window_id: pickupWindowId,
      p_quantity: quantity,
      p_customer_name: customerName,
      p_whatsapp_phone: whatsappPhone,
      p_public_token_hash: tokenHash,
      p_payment_deadline: paymentDeadline,
      p_fulfillment_type: fulfillmentType,
      p_delivery_address: deliveryAddress || null,
      p_delivery_postcode: deliveryPostcode || null,
      p_delivery_notes: deliveryNotes || null,
    });
    if (error) throw error;
    const order = Array.isArray(data) ? data[0] : data;
    return json({ orderReference: order.order_reference, statusToken: token, reservationExpiresAt: order.reservation_expires_at });
  } catch (error) {
    console.error('order_creation_error', error);
    const message = error instanceof Error && /capacity|available|deadline/i.test(error.message) ? error.message : 'Unable to create the order';
    return json({ error: message }, 409);
  }
}
