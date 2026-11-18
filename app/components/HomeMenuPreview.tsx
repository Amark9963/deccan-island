'use client';

import { useEffect, useState } from 'react';
import { resolveProductImage } from '@/lib/product-image';

type Product = {
  id: string;
  name: string;
  description: string;
  price_myr: number;
  image_url?: string;
};

export default function HomeMenuPreview() {
  const [products,setProducts] = useState<Product[]>([]);
  const [loading,setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/availability')
      .then(response => response.json())
      .then(data => {
        const serviceDate = data.dates?.find((date:{ products?:Product[] }) => date.products?.length);
        setProducts((serviceDate?.products ?? []).slice(0,3));
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  return <section id="menu" className="home-menu-section section-wrap">
    <div className="home-menu-heading">
      <div><p className="eyebrow">This weekend’s menu</p><h2>Choose what we<br/><em>should prepare.</em></h2></div>
      <div><p>A concise menu cooked in limited batches. Select your dishes first, then choose pickup or delivery.</p><a className="text-link" href="/menu">Browse the full menu <span>→</span></a></div>
    </div>
    {loading ? <div className="home-menu-loading" aria-label="Loading this weekend’s menu"><span/><span/><span/></div> : products.length ? <div className="home-menu-grid">{products.map(product => { const image=resolveProductImage(product); return <a className="home-menu-card customer-card" href="/menu" key={product.id}>
      {image ? <img src={image} alt={product.name}/> : <div className="home-menu-image-fallback" aria-hidden="true">DI</div>}
      <div className="home-menu-card-copy"><div><h3>{product.name}</h3><p>{product.description}</p></div><strong>RM{Number(product.price_myr).toFixed(2)}</strong></div>
    </a>; })}</div> : <div className="home-menu-empty"><p>The next weekend menu is being prepared.</p><a className="text-link" href="/menu">Check the menu <span>→</span></a></div>}
  </section>;
}
