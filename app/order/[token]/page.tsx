import { createHash } from 'node:crypto';
import { notFound } from 'next/navigation';
import CustomerHeader from '@/app/components/CustomerHeader';
import PageIntro from '@/app/components/PageIntro';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import './order-status.css';

export const dynamic = 'force-dynamic';

const formatDate = (value:string) => new Intl.DateTimeFormat('en-MY', { weekday:'long', day:'numeric', month:'long', year:'numeric', timeZone:'Asia/Kuala_Lumpur' }).format(new Date(`${value}T12:00:00+08:00`));
const formatTime = (value:string) => new Intl.DateTimeFormat('en-MY', { hour:'numeric', minute:'2-digit', hour12:true, timeZone:'Asia/Kuala_Lumpur' }).format(new Date(`1970-01-01T${value}+08:00`));

export default async function OrderStatusPage({ params }:{ params:{ token:string } }) {
  const hash = createHash('sha256').update(params.token).digest('hex');
  let order;
  try {
    const result = await getSupabaseAdmin().from('orders').select('order_reference,status,payment_status,quantity,total_myr,payment_deadline,fulfillment_type,delivery_status,delivery_postcode,products(name),service_dates(service_date),pickup_windows(starts_at,ends_at),order_items(product_name,quantity,line_total_myr)').eq('public_token_hash',hash).maybeSingle();
    if (result.error) throw result.error;
    order = result.data;
  } catch (error) {
    console.error('order_status_error',error);
    notFound();
  }
  if (!order) notFound();

  const serviceDate = Array.isArray(order.service_dates) ? order.service_dates[0] : order.service_dates;
  const pickupWindow = Array.isArray(order.pickup_windows) ? order.pickup_windows[0] : order.pickup_windows;
  const product = Array.isArray(order.products) ? order.products[0] : order.products;
  const items = order.order_items ?? [];
  const whatsappNumber = process.env.WHATSAPP_NUMBER;
  const whatsappUrl = whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hi Deccan Island, I’ve submitted order ${order.order_reference} for RM${Number(order.total_myr).toFixed(2)}. I’d like to arrange payment and confirmation.`)}` : null;
  const deliveryLabel = order.delivery_status?.replaceAll('_',' ');
  const statusLabel: Record<string,string> = {
    awaiting_payment: 'Awaiting confirmation',
    payment_under_review: 'Payment being checked',
    confirmed: 'Confirmed',
    collected: 'Collected',
    expired: 'Expired',
    cancelled: 'Cancelled',
  };

  return <main className="status-page">
    <CustomerHeader actionHref="/" actionLabel={<>Back home <b aria-hidden="true">→</b></>} />
    <div className="status-wrap">
      <PageIntro eyebrow="Private order status" title="Your order" accent="at a glance." description="Keep this private link to check the latest details for your order." />
      <section className="status-card customer-card">
        <div className="status-top"><div><span className="status-label">Order reference</span><strong>{order.order_reference}</strong></div><span className={`status-pill status-${order.status}`}>{statusLabel[order.status] ?? order.status.replaceAll('_',' ')}</span></div>
        <div className="status-grid">
          <div><span>Items</span><strong>{items.length ? items.map(item => `${item.quantity}× ${item.product_name}`).join(', ') : product?.name}</strong></div>
          <div><span>Quantity</span><strong>{order.quantity} portion{order.quantity===1?'':'s'}</strong></div>
          <div><span>{order.fulfillment_type==='delivery'?'Delivery area':'Pickup date'}</span><strong>{order.fulfillment_type==='delivery' ? order.delivery_postcode : serviceDate?.service_date ? formatDate(serviceDate.service_date) : 'To be confirmed'}</strong></div>
          <div><span>{order.fulfillment_type==='delivery'?'Delivery status':'Pickup window'}</span><strong>{order.fulfillment_type==='delivery' ? deliveryLabel : pickupWindow ? `${formatTime(pickupWindow.starts_at)} – ${formatTime(pickupWindow.ends_at)}` : 'To be confirmed'}</strong></div>
        </div>
        <div className="status-total"><span>{order.fulfillment_type==='delivery'?'Food subtotal':'Order total'}</span><strong>RM{Number(order.total_myr).toFixed(2)}</strong></div>
        {order.fulfillment_type==='delivery' && <div className="payment-note"><strong>Delivery request · {deliveryLabel}</strong><p>Your delivery is coordinated manually. Rider timing and fee will be confirmed separately by WhatsApp.</p></div>}
        {order.status==='awaiting_payment' && <div className="payment-note"><strong>Complete your order on WhatsApp.</strong><p>We’ll share payment instructions privately and confirm your order after payment is received.</p>{order.payment_deadline && <small>Your portions are held until {new Date(order.payment_deadline).toLocaleString('en-MY',{timeZone:'Asia/Kuala_Lumpur'})} MYT.</small>}</div>}
      </section>
      <div className="status-actions">{whatsappUrl ? <a className="button" href={whatsappUrl}>{order.status==='awaiting_payment'?'Continue on WhatsApp':'Contact on WhatsApp'} <span>→</span></a> : <p className="status-muted">WhatsApp contact details will be added before launch.</p>}</div>
    </div>
  </main>;
}
