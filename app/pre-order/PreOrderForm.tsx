'use client';
import { FormEvent, useEffect, useState } from 'react';

type Product = { id:string; name:string; description:string; price_myr:number; image_url?:string };
type Window = { id:string; starts_at:string; ends_at:string; capacity:number };
type ServiceDate = { id:string; service_date:string; pickup_windows:Window[]; products?:Product[] };
type CartItem = Product & { quantity:number };

const localDate = (value:string) => new Date(`${value}T12:00:00+08:00`);
const dateLabel = (value:string) => new Intl.DateTimeFormat('en-MY', { weekday:'long', day:'numeric', month:'long', timeZone:'Asia/Kuala_Lumpur' }).format(localDate(value));
const shortDate = (value:string) => new Intl.DateTimeFormat('en-MY', { weekday:'short', day:'numeric', month:'short', timeZone:'Asia/Kuala_Lumpur' }).format(localDate(value));
const timeLabel = (value:string) => new Intl.DateTimeFormat('en-MY', { hour:'numeric', minute:'2-digit', hour12:true, timeZone:'Asia/Kuala_Lumpur' }).format(new Date(`1970-01-01T${value}+08:00`));

export default function PreOrderForm() {
  const [dates,setDates] = useState<ServiceDate[]>([]);
  const [cart,setCart] = useState<CartItem[]>([]);
  const [dateId,setDateId] = useState('');
  const [windowId,setWindowId] = useState('');
  const [fulfillment,setFulfillment] = useState<'pickup'|'delivery'|''>('');
  const [name,setName] = useState('');
  const [phone,setPhone] = useState('');
  const [address,setAddress] = useState('');
  const [postcode,setPostcode] = useState('');
  const [notes,setNotes] = useState('');
  const [step,setStep] = useState(1);
  const [message,setMessage] = useState('');
  const [loading,setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/availability').then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setDates(data.dates ?? []);
      const saved = JSON.parse(localStorage.getItem('deccan-cart') || '{}') as Record<string,number>;
      const products = (data.dates?.[0]?.products ?? []) as Product[];
      setCart(products.filter(product => saved[product.id] > 0).map(product => ({ ...product, quantity:saved[product.id] })));
    }).catch(error => setMessage(error.message)).finally(() => setLoading(false));
  }, []);

  const selectedDate = dates.find(date => date.id === dateId);
  const selectedWindow = selectedDate?.pickup_windows.find(window => window.id === windowId);
  const totalQty = cart.reduce((total,item) => total + item.quantity, 0);
  const total = cart.reduce((amount,item) => amount + Number(item.price_myr) * item.quantity, 0);
  const scheduleSummary = selectedDate ? fulfillment === 'delivery' ? `${dateLabel(selectedDate.service_date)} · Delivery request` : selectedWindow ? `${dateLabel(selectedDate.service_date)} · ${timeLabel(selectedWindow.starts_at)}–${timeLabel(selectedWindow.ends_at)}` : dateLabel(selectedDate.service_date) : 'Select a date';
  const serviceReady = Boolean(fulfillment && dateId && (fulfillment === 'delivery' || windowId));

  function selectFulfillment(value:'pickup'|'delivery') {
    setFulfillment(value);
    setDateId('');
    setWindowId('');
  }

  async function submit(event?:FormEvent) {
    event?.preventDefault();
    setMessage('');
    const response = await fetch('/api/orders', { method:'POST', headers:{ 'Content-Type':'application/json', 'Idempotency-Key':crypto.randomUUID() }, body:JSON.stringify({ items:cart.map(item => ({ productId:item.id, quantity:item.quantity })), serviceDateId:dateId, pickupWindowId:fulfillment === 'pickup' ? windowId : null, customerName:name, whatsappPhone:phone, fulfillmentType:fulfillment, deliveryAddress:address, deliveryPostcode:postcode, deliveryNotes:notes }) });
    const data = await response.json();
    if (!response.ok) return setMessage(data.error ?? 'Unable to create the order');
    localStorage.removeItem('deccan-cart');
    setMessage(`Order ${data.orderReference} created. Payment instructions are ready.`);
  }

  if (loading) return <p className="checkout-status">Checking available weekends…</p>;
  if (!cart.length) return <section className="checkout-status"><strong>Your cart is empty.</strong><p>Choose your dishes from the menu before selecting a service date.</p><a className="button" href="/menu">Browse the menu <span>→</span></a></section>;

  return <div className="checkout-form-content">
    <div className="checkout-steps" aria-label={`Checkout step ${step} of 3`}><span className={step>=1?'active':''}>01 Receive</span><span className={step>=2?'active':''}>02 Details</span><span className={step>=3?'active':''}>03 Review</span></div>
    {step === 1 ? <section>
      <div className="checkout-heading"><p className="eyebrow">01 · Service</p><h2>How would you like it?</h2><p className="checkout-muted">Choose pickup or delivery to continue.</p></div>
      <div className="order-summary">{cart.map(item => <div className="order-summary-item" key={item.id}>{item.image_url && <img src={item.image_url} alt=""/>}<span>{item.quantity} × {item.name}</span><strong>RM{(Number(item.price_myr)*item.quantity).toFixed(2)}</strong></div>)}<div className="order-summary-total"><span>{totalQty} item{totalQty===1?'':'s'}</span><strong>RM{total.toFixed(2)}</strong></div></div>
      <fieldset className="fulfillment-choice"><legend>Receive your order</legend><div className="fulfillment-options">
        <label className={fulfillment==='pickup'?'selected':''}><input type="radio" name="fulfillment" checked={fulfillment==='pickup'} onChange={() => selectFulfillment('pickup')}/><span><b>Self-pickup</b><small>Choose a date and collection time</small></span></label>
        <label className={fulfillment==='delivery'?'selected':''}><input type="radio" name="fulfillment" checked={fulfillment==='delivery'} onChange={() => selectFulfillment('delivery')}/><span><b>Delivery request</b><small>Choose a date; timing is confirmed by WhatsApp</small></span></label>
      </div></fieldset>
      {fulfillment ? <div className="date-time-fields">
        <div className="date-slot-field"><span className="field-label">Service date</span><div className="date-slot-list">{dates.map(date => <button type="button" className={dateId===date.id?'date-slot selected':'date-slot'} key={date.id} onClick={() => { setDateId(date.id); setWindowId(''); }}>{shortDate(date.service_date)}</button>)}</div></div>
        {fulfillment === 'pickup' ? <div className="time-slot-field"><span className="field-label">Collection time</span><div className="time-slot-list">{selectedDate?.pickup_windows.map(window => <button type="button" className={windowId===window.id?'time-slot selected':'time-slot'} key={window.id} onClick={() => setWindowId(window.id)}>{timeLabel(window.starts_at)} – {timeLabel(window.ends_at)}</button>)}</div>{!selectedDate && <p className="field-hint">Select a date to see available times.</p>}</div> : <div className="delivery-schedule-note"><strong>Delivery timing</strong><p>We’ll confirm the rider time and fee with you on WhatsApp after reviewing your address.</p></div>}
      </div> : <div className="fulfillment-hint">Select self-pickup or delivery to choose a service date.</div>}
      <button className="button checkout-button" disabled={!serviceReady} onClick={() => setStep(2)}>Continue <span>→</span></button>
    </section> : step === 2 ? <form onSubmit={event => { event.preventDefault(); setStep(3); }}>
      <p className="eyebrow">02 · Your details</p><h2>{fulfillment === 'delivery' ? 'Where should we deliver?' : 'Where should we send your confirmation?'}</h2>
      <label>Name<input required value={name} onChange={event => setName(event.target.value)} placeholder="Your name"/></label><label>WhatsApp number<input required value={phone} onChange={event => setPhone(event.target.value)} placeholder="+60…"/></label>
      {fulfillment === 'delivery' && <div className="delivery-fields"><p className="checkout-muted">Delivery is manually reviewed. The rider fee and timing will be confirmed separately.</p><label>Delivery address<textarea required value={address} onChange={event => setAddress(event.target.value)} rows={3}/></label><label>Postcode<input required value={postcode} onChange={event => setPostcode(event.target.value)}/></label><label>Rider notes <span className="label-optional">optional</span><textarea value={notes} onChange={event => setNotes(event.target.value)} rows={2}/></label></div>}
      <div className="checkout-actions"><button type="button" className="text-button" onClick={() => setStep(1)}>← Back</button><button className="button checkout-button" type="submit">Review order <span>→</span></button></div>
    </form> : <section>
      <p className="eyebrow">03 · Payment</p><h2>Review your order.</h2><p className="checkout-muted">Submit your order request. DuitNow payment instructions will be shown once the order is accepted.</p>
      <div className="review-box">{cart.map(item => <span key={item.id}>{item.quantity} × {item.name}</span>)}<span>{scheduleSummary}</span><span>{fulfillment==='delivery'?`Delivery request · ${postcode}`:'Self-pickup'}</span><strong>RM{total.toFixed(2)}</strong></div>
      <div className="checkout-actions"><button className="text-button" onClick={() => setStep(2)}>← Edit details</button><button className="button checkout-button" onClick={() => submit()}>Submit order <span>→</span></button></div>{message && <p className="checkout-status">{message}</p>}
    </section>}
  </div>;
}
