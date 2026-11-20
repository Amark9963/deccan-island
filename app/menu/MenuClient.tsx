'use client';

import { useCallback, useEffect, useState } from 'react';
import CustomerHeader from '../components/CustomerHeader';
import PageIntro from '../components/PageIntro';
import OptimizedFoodImage from '../components/OptimizedFoodImage';
import { resolveProductImage } from '@/lib/product-image';
import { formatBookingDeadline, formatServiceDate } from '@/lib/service-format';
import type { AvailabilityData, Product, ServiceDate } from '@/lib/availability';

const parts = (value:string) => { const date = new Date(`${value}T12:00:00+08:00`); return {
  weekday: new Intl.DateTimeFormat('en-MY',{weekday:'short',timeZone:'Asia/Kuala_Lumpur'}).format(date),
  day: new Intl.DateTimeFormat('en-MY',{day:'numeric',timeZone:'Asia/Kuala_Lumpur'}).format(date),
  month: new Intl.DateTimeFormat('en-MY',{month:'short',timeZone:'Asia/Kuala_Lumpur'}).format(date),
}; };

export default function MenuClient({ initialData }: { initialData?: AvailabilityData }) {
  const [dates,setDates] = useState<ServiceDate[]>(initialData?.dates ?? []);
  const [cart,setCart] = useState<Record<string,number>>({});
  const [dateId,setDateId] = useState(initialData?.dates[0]?.id ?? '');
  const [loading,setLoading] = useState(!initialData);
  const [error,setError] = useState(false);

  const loadMenu = useCallback((showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(false);
    fetch('/api/availability').then(async response => {
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      const availableDates = (data.dates ?? []) as ServiceDate[]; setDates(availableDates);
      const savedDate = localStorage.getItem('deccan-service-date');
      let savedCart:Record<string,number>={}; try{savedCart=JSON.parse(localStorage.getItem('deccan-cart')||'{}')}catch{}
      const cartIds=Object.keys(savedCart).filter(id=>savedCart[id]>0);
      const compatibleDate=availableDates.find(date=>cartIds.every(id=>date.products.some(product=>product.id===id)));
      const initialDate = availableDates.some(date => date.id === savedDate) ? savedDate! : compatibleDate?.id ?? availableDates[0]?.id ?? '';
      setDateId(initialDate); if (initialDate) localStorage.setItem('deccan-service-date',initialDate);
    }).catch(() => { setDates([]); setError(true); }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadMenu(!initialData); try { setCart(JSON.parse(localStorage.getItem('deccan-cart') || '{}')); } catch { setCart({}); } }, [loadMenu, initialData]);

  const selectedDate=dates.find(date=>date.id===dateId);
  const visibleProducts=selectedDate?.products ?? [];
  const count=Object.values(cart).reduce((sum,value)=>sum+value,0);
  const total=visibleProducts.reduce((sum,product)=>sum+(cart[product.id]??0)*Number(product.price_myr),0);
  const deadline=formatBookingDeadline(selectedDate?.booking_deadline);
  const orderingOpen=Boolean(selectedDate);

  function update(id:string,delta:number) {
    const product = selectedDate?.products.find(item => item.id === id);
    if (delta > 0 && (!product || (cart[id] ?? 0) >= product.remaining || count >= (selectedDate?.remaining ?? 0))) return;
    const next={...cart,[id]:Math.max(0,(cart[id]??0)+delta)}; if(!next[id]) delete next[id];
    setCart(next); localStorage.setItem('deccan-cart',JSON.stringify(next)); window.dispatchEvent(new Event('cart-updated'));
  }

  function selectDate(nextId:string) {
    if (nextId === dateId) return;
    const nextDate = dates.find(date => date.id === nextId); if (!nextDate) return;
    const availableIds = new Set(nextDate.products.map(product => product.id));
    const removed = Object.keys(cart).filter(id => cart[id] > 0 && !availableIds.has(id));
    if (removed.length && !window.confirm('Some dishes in your cart are not offered on this date and will be removed. Continue?')) return;
    const nextCart = Object.fromEntries(Object.entries(cart).filter(([id]) => availableIds.has(id)));
    setCart(nextCart); localStorage.setItem('deccan-cart',JSON.stringify(nextCart)); localStorage.setItem('deccan-service-date',nextId); setDateId(nextId); window.dispatchEvent(new Event('cart-updated'));
  }

  return <main className="menu-page">
    <CustomerHeader actionHref="/cart" actionAriaLabel={`View cart with ${count} items`} actionLabel={<>Cart {count > 0 && <span>{count}</span>} <b aria-hidden="true">→</b></>} />
    <div className="menu-wrap">
      <PageIntro eyebrow="Small-batch weekend kitchen" title="This weekend’s" accent="menu." description="Choose a service date first, then add the dishes you would like us to prepare." />

      {!loading && !error && dates.length > 0 && <section className="menu-date-picker" aria-labelledby="menu-date-heading">
        <div><span className="menu-date-step">First, choose a date</span><h2 id="menu-date-heading">When are we cooking for you?</h2></div>
        <div className="menu-date-rail">{dates.map(date => { const dateParts=parts(date.service_date); return <button type="button" aria-label={formatServiceDate(date.service_date)} aria-pressed={date.id===dateId} className={date.id===dateId?'selected':''} key={date.id} onClick={()=>selectDate(date.id)}><span>{dateParts.weekday}</span><strong>{dateParts.day}</strong><small>{dateParts.month}</small></button>; })}</div>
      </section>}

      {!loading && !error && <section className={`menu-service-banner ${orderingOpen ? 'is-open' : 'is-coming'}`} aria-live="polite">
        <div><span>{selectedDate && new Date(`${selectedDate.service_date}T12:00:00+08:00`).getUTCDay()===0 ? 'Sunday specials' : 'Selected service'}</span><strong>{selectedDate ? formatServiceDate(selectedDate.service_date) : 'Next service date coming soon'}</strong></div>
        <div>{deadline && <p><span>Order by</span><strong>{deadline}</strong></p>}{selectedDate && <small>{selectedDate.remaining} of 15 total portions currently available.</small>}{!orderingOpen && <small>Ordering reopens when a service date is published.</small>}</div>
      </section>}

      {loading ? <div className="menu-loading" aria-label="Loading menu"><span/><span/></div> : error ? <section className="menu-state customer-card" role="alert"><strong>We couldn’t load the menu.</strong><p>Please check your connection and try again.</p><button className="state-retry" type="button" onClick={() => loadMenu()}>Try again</button></section> : visibleProducts.length ? <div className="menu-grid">
        {visibleProducts.map(product => { const image=resolveProductImage(product); const soldOut=product.remaining<=0 || (selectedDate?.remaining ?? 0)<=0; return <article className={`menu-card customer-card${soldOut?' is-sold-out':''}`} key={product.id}>
          {image && <OptimizedFoodImage src={image} alt={product.name} sizes="(max-width: 700px) calc(100vw - 36px), 50vw" />}
          <div className="menu-card-body">
            <div><span className="menu-card-kicker">{new Date(`${selectedDate!.service_date}T12:00:00+08:00`).getUTCDay()===0?'Sunday menu':'Weekend batch'}</span><h2>{product.name}</h2><p>{product.description}</p></div>
            <div className="menu-price"><strong>RM{Number(product.price_myr).toFixed(2)}</strong><small>{soldOut?'Sold out':`${product.remaining} portion${product.remaining===1?'':'s'} available`}</small></div>
            <div className="menu-card-actions" aria-label={`Quantity for ${product.name}`}><button aria-label={`Remove one ${product.name}`} onClick={() => update(product.id,-1)} disabled={!cart[product.id]}>−</button><span aria-live="polite">{cart[product.id] ?? 0}</span><button aria-label={`Add one ${product.name}`} onClick={() => update(product.id,1)} disabled={!orderingOpen || soldOut || (cart[product.id]??0)>=product.remaining || count>=(selectedDate?.remaining??0)}>+</button></div>
          </div>
        </article>; })}
      </div> : <section className="menu-state customer-card"><strong>This service date has sold out.</strong><p>Choose another available date to see its menu.</p></section>}
      {count > 0 && orderingOpen && <a className="button menu-continue" href="/cart"><span>View cart · {count} item{count===1?'':'s'}</span><strong>RM{total.toFixed(2)} →</strong></a>}
    </div>
  </main>;
}
