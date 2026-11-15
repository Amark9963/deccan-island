'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

type Window = { id: string; starts_at: string; ends_at: string; capacity: number };
type ServiceDate = { id: string; service_date: string; daily_capacity: number; booking_deadline: string | null; pickup_windows: Window[]; products?: { id: string; name: string; price_myr: number }[] };

const formatDate = (value: string) => new Intl.DateTimeFormat('en-MY', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Kuala_Lumpur' }).format(new Date(`${value}T12:00:00+08:00`));
const formatTime = (value: string) => new Intl.DateTimeFormat('en-MY', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kuala_Lumpur' }).format(new Date(`1970-01-01T${value}+08:00`));

export default function PreOrderForm() {
  const [dates, setDates] = useState<ServiceDate[]>([]);
  const [dateId, setDateId] = useState('');
  const [windowId, setWindowId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch('/api/availability').then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error); setDates(data.dates ?? []); }).catch((error) => setMessage(error.message)).finally(() => setLoading(false)); }, []);
  const selectedDate = dates.find((date) => date.id === dateId);
  const selectedWindow = selectedDate?.pickup_windows.find((item) => item.id === windowId);
  const product = selectedDate?.products?.[0];
  const price = product?.price_myr ?? 22;
  const total = price * quantity;
  const canContinue = Boolean(dateId && windowId && quantity > 0);

  const orderSummary = useMemo(() => selectedDate && selectedWindow ? `${formatDate(selectedDate.service_date)} · ${formatTime(selectedWindow.starts_at)}–${formatTime(selectedWindow.ends_at)}` : 'Select a date and pickup window', [selectedDate, selectedWindow]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage('');
    const response = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify({ productId: product?.id, serviceDateId: dateId, pickupWindowId: windowId, quantity, customerName: name, whatsappPhone: phone }) });
    const data = await response.json();
    if (!response.ok) { setMessage(data.error ?? 'Unable to create the order'); return; }
    setMessage(`Order ${data.orderReference} created. Payment instructions are ready.`);
  }

  return <div className="checkout-wrap"><div className="checkout-intro"><p className="eyebrow">Weekend pre-order</p><h1>One pot.<br/><em>Your table.</em></h1><p>Choose a pickup window for Hyderabadi Chicken Dum Biryani. Orders are limited by the batch.</p></div><div className="checkout-card"><div className="checkout-steps"><span className={step >= 1 ? 'active' : ''}>01 Select</span><span className={step >= 2 ? 'active' : ''}>02 Details</span><span className={step >= 3 ? 'active' : ''}>03 Payment</span></div>{loading ? <p className="checkout-status">Checking available weekends…</p> : message && dates.length === 0 ? <div className="checkout-status"><strong>Pre-orders are not open yet.</strong><p>{message}</p><a href="/" className="text-link">Return home <span>→</span></a></div> : step === 1 ? <section><p className="eyebrow">01 · Choose your pickup</p><h2>When should we pack your biryani?</h2><label>Pickup date<select value={dateId} onChange={(event) => { setDateId(event.target.value); setWindowId(''); }}>{dates.length === 0 ? <option value="">Dates opening soon</option> : <><option value="">Select a date</option>{dates.map((date) => <option key={date.id} value={date.id}>{formatDate(date.service_date)}</option>)}</>}</select></label><label>Pickup window<select value={windowId} onChange={(event) => setWindowId(event.target.value)} disabled={!selectedDate}><option value="">Select a window</option>{selectedDate?.pickup_windows.map((item) => <option key={item.id} value={item.id}>{formatTime(item.starts_at)} – {formatTime(item.ends_at)} · {item.capacity} portions</option>)}</select></label><label>Portions<div className="quantity"><button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button><strong>{quantity}</strong><button type="button" onClick={() => setQuantity(Math.min(15, quantity + 1))}>+</button></div></label><div className="summary-row"><span>{orderSummary}</span><strong>RM{total.toFixed(2)}</strong></div><button className="button checkout-button" disabled={!canContinue} onClick={() => setStep(2)}>Continue <span>→</span></button></section> : step === 2 ? <form onSubmit={(event) => { event.preventDefault(); setStep(3); }}><p className="eyebrow">02 · Your details</p><h2>Where should we send your confirmation?</h2><p className="checkout-muted">We’ll use WhatsApp for order and pickup communication only.</p><label>Name<input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" /></label><label>WhatsApp number<input required value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+60…" /></label><div className="summary-row"><span>{quantity} portion · {orderSummary}</span><strong>RM{total.toFixed(2)}</strong></div><div className="checkout-actions"><button type="button" className="text-button" onClick={() => setStep(1)}>← Back</button><button className="button checkout-button" type="submit">Review order <span>→</span></button></div></form> : <section><p className="eyebrow">03 · Payment</p><h2>Review before we open orders.</h2><p className="checkout-muted">Your details are ready, but live ordering is still being configured. DuitNow payment instructions will appear here once launch details are confirmed.</p><div className="review-box"><span>{name}</span><span>{phone}</span><span>{quantity} × Hyderabadi Chicken Dum Biryani</span><span>{orderSummary}</span><strong>RM{total.toFixed(2)}</strong></div><div className="checkout-actions"><button className="text-button" onClick={() => setStep(2)}>← Edit details</button><button className="button checkout-button" onClick={submit}>Submit order <span>→</span></button></div>{message && <p className="checkout-status">{message}</p>}</section>}</div></div>;
}
