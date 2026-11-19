'use client';

import { useCallback, useEffect, useState } from 'react';
import { resolveProductImage } from '@/lib/product-image';
import { formatBookingDeadline, formatServiceDate } from '@/lib/service-format';
import OptimizedFoodImage from './OptimizedFoodImage';

type Product = {
  id: string;
  name: string;
  description: string;
  price_myr: number;
  image_url?: string;
};

type ServiceDate = {
  id: string;
  service_date: string;
  booking_deadline?: string | null;
};

export default function HomeMenuPreview() {
  const [products,setProducts] = useState<Product[]>([]);
  const [dates,setDates] = useState<ServiceDate[]>([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState(false);

  const loadMenu = useCallback(() => {
    setLoading(true);
    setError(false);
    fetch('/api/availability')
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setProducts((data.products ?? []).slice(0,3));
        setDates(data.dates ?? []);
      })
      .catch(() => {
        setProducts([]);
        setDates([]);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadMenu(); }, [loadMenu]);

  const nextDate = dates[0];
  const deadline = formatBookingDeadline(nextDate?.booking_deadline);

  return <section id="menu" className="home-menu-section section-wrap">
    <div className="home-menu-heading">
      <div><p className="eyebrow">This weekend’s menu</p><h2>Choose what we<br/><em>should prepare.</em></h2></div>
      <div><p>A concise menu cooked in limited batches. Select your dishes first, then choose pickup or delivery.</p><a className="text-link" href="/menu">Browse the full menu <span>→</span></a></div>
    </div>
    {!loading && !error && <div className={`home-service-note ${nextDate ? 'is-open' : 'is-coming'}`}>
      {nextDate ? <><span>Next service</span><strong>{formatServiceDate(nextDate.service_date)}</strong>{deadline && <small>Orders close {deadline}</small>}{dates.length > 1 && <small>{dates.length - 1} more date{dates.length === 2 ? '' : 's'} available at checkout</small>}</> : <><span>Weekend pre-orders</span><strong>Next service date coming soon</strong><small>You can still browse the menu below.</small></>}
    </div>}
    {loading ? <div className="home-menu-loading" aria-label="Loading this weekend’s menu"><span/><span/><span/></div> : error ? <div className="home-menu-empty" role="alert"><p>We couldn’t load the weekend menu.</p><button className="state-retry" type="button" onClick={loadMenu}>Try again</button></div> : products.length ? <div className="home-menu-grid">{products.map(product => { const image=resolveProductImage(product); return <a className="home-menu-card customer-card" href="/menu" key={product.id}>
      {image ? <OptimizedFoodImage src={image} alt={product.name} sizes="(max-width: 700px) calc(100vw - 36px), 31vw"/> : <div className="home-menu-image-fallback" aria-hidden="true">DI</div>}
      <div className="home-menu-card-copy"><div><span className="menu-card-kicker">Weekend batch</span><h3>{product.name}</h3><p>{product.description}</p></div><div className="menu-price"><strong>RM{Number(product.price_myr).toFixed(2)}</strong><small>per portion</small></div></div>
    </a>; })}</div> : <div className="home-menu-empty"><p>This weekend’s dishes have sold out. The next menu will be announced soon.</p><a className="text-link" href="/menu">Check the menu <span>→</span></a></div>}
  </section>;
}
