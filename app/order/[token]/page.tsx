import { createHash } from 'node:crypto';
import { notFound } from 'next/navigation';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import './order-status.css';

export const dynamic = 'force-dynamic';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kuala_Lumpur' }).format(new Date(`${value}T12:00:00+08:00`));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('en-MY', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kuala_Lumpur' }).format(new Date(`1970-01-01T${value}+08:00`));
}

export default async function OrderStatusPage({ params }: { params: { token: string } }) {
  const tokenHash = createHash('sha256').update(params.token).digest('hex');
  let order;
  try {
    const supabase = getSupabaseAdmin();
    const result = await supabase.from('orders').select('order_reference,status,payment_status,quantity,total_myr,payment_deadline,created_at,fulfillment_type,delivery_status,delivery_address,delivery_postcode,delivery_notes,products(name),service_dates(service_date),pickup_windows(starts_at,ends_at)').eq('public_token_hash', tokenHash).maybeSingle();
    if (result.error) throw result.error;
    order = result.data;
  } catch (error) {
    console.error('order_status_error', error);
    notFound();
  }
  if (!order) notFound();
  const serviceDate = Array.isArray(order.service_dates) ? order.service_dates[0] : order.service_dates;
  const pickupWindow = Array.isArray(order.pickup_windows) ? order.pickup_windows[0] : order.pickup_windows;
  const product = Array.isArray(order.products) ? order.products[0] : order.products;
  const whatsappNumber = process.env.WHATSAPP_NUMBER;
  const whatsappMessage = encodeURIComponent(`Hi Deccan Island, I’m contacting you about order ${order.order_reference}.`);
  const whatsappUrl = whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${whatsappMessage}` : null;
  const statusLabel = order.status.replaceAll('_', ' ');

  return <main className="status-page"><header className="status-header"><a href="/"><img src="/deccan-island-logo.svg" alt="Deccan Island — Hyderabadi Dum Kitchen" /></a><a href="/">Back to home</a></header><div className="status-wrap"><p className="eyebrow">Private order status</p><h1>Your order<br/><em>at a glance.</em></h1><section className="status-card"><div className="status-top"><div><span className="status-label">Order reference</span><strong>{order.order_reference}</strong></div><span className={`status-pill status-${order.status}`}>{statusLabel}</span></div><div className="status-grid"><div><span>Order</span><strong>{product?.name ?? 'Hyderabadi Chicken Dum Biryani'}</strong></div><div><span>Quantity</span><strong>{order.quantity} portion{order.quantity === 1 ? '' : 's'}</strong></div><div><span>Pickup date</span><strong>{serviceDate?.service_date ? formatDate(serviceDate.service_date) : 'To be confirmed'}</strong></div><div><span>Pickup window</span><strong>{pickupWindow ? `${formatTime(pickupWindow.starts_at)} – ${formatTime(pickupWindow.ends_at)}` : 'To be confirmed'}</strong></div></div><div className="status-total"><span>Total</span><strong>RM{Number(order.total_myr).toFixed(2)}</strong></div>{order.status === 'awaiting_payment' && <div className="payment-note"><strong>Payment is still pending.</strong><p>Once your order is created, follow the DuitNow instructions provided by Deccan Island. Your reservation may expire if payment is not reported before the deadline.</p>{order.payment_deadline && <small>Payment deadline: {new Date(order.payment_deadline).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })} MYT</small>}</div>}{order.status === 'confirmed' && <div className="payment-note"><strong>Your order is confirmed.</strong><p>Pickup instructions will be shared with your confirmation message.</p></div>}</section><div className="status-actions">{whatsappUrl ? <a className="button" href={whatsappUrl}>Contact on WhatsApp <span>→</span></a> : <p className="status-muted">WhatsApp contact details will be added before launch.</p>}<p className="status-muted">Changes are subject to availability and operational approval.</p></div></div></main>;
}
