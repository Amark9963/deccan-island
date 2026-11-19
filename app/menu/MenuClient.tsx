'use client';

import { useCallback, useEffect, useState } from 'react';
import CustomerHeader from '../components/CustomerHeader';
import PageIntro from '../components/PageIntro';
import OptimizedFoodImage from '../components/OptimizedFoodImage';
import { resolveProductImage } from '@/lib/product-image';
import { formatBookingDeadline, formatServiceDate } from '@/lib/service-format';

type Product = { id:string; name:string; description:string; price_myr:number; image_url?:string };
type ServiceDate = { id:string; service_date:string; booking_deadline?:string|null };

export default function MenuClient() {
  const [products,setProducts] = useState<Product[]>([]);
  const [dates,setDates] = useState<ServiceDate[]>([]);
  const [cart,setCart] = useState<Record<string,number>>({});
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState(false);

  const loadMenu = useCallback(() => {
    setLoading(true);
    setError(false);
    fetch('/api/availability')
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setProducts(data.products ?? []);
        setDates(data.dates ?? []);
      })
      .catch(() => {
        setProducts([]);
        setDates([]);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadMenu();
    try { setCart(JSON.parse(localStorage.getItem('deccan-cart') || '{}')); } catch { setCart({}); }
  }, [loadMenu]);

  function update(id:string,delta:number) {
    const next={...cart,[id]:Math.max(0,(cart[id]??0)+delta)};
    if(!next[id]) delete next[id];
    setCart(next);
    localStorage.setItem('deccan-cart',JSON.stringify(next));
    window.dispatchEvent(new Event('cart-updated'));
  }

  const count=Object.values(cart).reduce((sum,value)=>sum+value,0);
  const total=products.reduce((sum,product)=>sum+(cart[product.id]??0)*Number(product.price_myr),0);
  const nextDate=dates[0];
  const deadline=formatBookingDeadline(nextDate?.booking_deadline);
  const orderingOpen=Boolean(nextDate);

  return <main className="menu-page">
    <CustomerHeader actionHref="/cart" actionAriaLabel={`View cart with ${count} items`} actionLabel={<>Cart {count > 0 && <span>{count}</span>} <b aria-hidden="true">→</b></>} />
    <div className="menu-wrap">
      <PageIntro eyebrow="Small-batch weekend kitchen" title="This weekend’s" accent="menu." description="Prepared in limited batches in Penang. Choose your dishes first, then select pickup or delivery." />

      {!loading && !error && <section className={`menu-service-banner ${orderingOpen ? 'is-open' : 'is-coming'}`} aria-live="polite">
        <div><span>{orderingOpen ? 'Next service' : 'Weekend pre-orders'}</span><strong>{nextDate ? formatServiceDate(nextDate.service_date) : 'Next service date coming soon'}</strong></div>
        <div>{deadline && <p><span>Order by</span><strong>{deadline}</strong></p>}{dates.length > 1 && <small>{dates.length - 1} additional service date{dates.length === 2 ? '' : 's'} available during checkout.</small>}{!orderingOpen && <small>The menu is available to browse. Ordering reopens when a service date is published.</small>}</div>
      </section>}

      {loading ? <div className="menu-loading" aria-label="Loading menu"><span/><span/></div> : error ? <section className="menu-state customer-card" role="alert"><strong>We couldn’t load the menu.</strong><p>Please check your connection and try again.</p><button className="state-retry" type="button" onClick={loadMenu}>Try again</button></section> : products.length ? <div className="menu-grid">
        {products.map(product => { const image=resolveProductImage(product); return <article className="menu-card customer-card" key={product.id}>
          {image && <OptimizedFoodImage src={image} alt={product.name} sizes="(max-width: 700px) calc(100vw - 36px), 50vw" />}
          <div className="menu-card-body">
            <div><span className="menu-card-kicker">Weekend batch</span><h2>{product.name}</h2><p>{product.description}</p></div>
            <div className="menu-price"><strong>RM{Number(product.price_myr).toFixed(2)}</strong><small>per portion</small></div>
            <div className="menu-card-actions" aria-label={`Quantity for ${product.name}`}>
              <button aria-label={`Remove one ${product.name}`} onClick={() => update(product.id,-1)} disabled={!cart[product.id]}>−</button>
              <span aria-live="polite">{cart[product.id] ?? 0}</span>
              <button aria-label={`Add one ${product.name}`} onClick={() => update(product.id,1)} disabled={!orderingOpen} title={orderingOpen ? undefined : 'Ordering reopens when the next service date is published'}>+</button>
              {!orderingOpen && <small>Ordering opens with the next service date.</small>}
            </div>
          </div>
        </article>; })}
      </div> : <section className="menu-state customer-card"><strong>This weekend’s dishes have sold out.</strong><p>The next small-batch menu will be announced soon.</p></section>}
      {count > 0 && orderingOpen && <a className="button menu-continue" href="/cart"><span>View cart · {count} item{count===1?'':'s'}</span><strong>RM{total.toFixed(2)} →</strong></a>}
    </div>
  </main>;
}
