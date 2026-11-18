'use client';
import { useEffect, useState } from 'react';
import CustomerHeader from '../components/CustomerHeader';
import PageIntro from '../components/PageIntro';
type Product = { id:string; name:string; description:string; price_myr:number; image_url?:string };
export default function MenuClient() {
  const [products,setProducts] = useState<Product[]>([]); const [cart,setCart] = useState<Record<string,number>>({}); const [loading,setLoading] = useState(true);
  useEffect(() => { fetch('/api/availability').then(response => response.json()).then(data => setProducts(data.dates?.[0]?.products ?? [])).finally(() => setLoading(false)); try { setCart(JSON.parse(localStorage.getItem('deccan-cart') || '{}')); } catch { setCart({}); } }, []);
  function update(id:string,delta:number) { const next={...cart,[id]:Math.max(0,(cart[id]??0)+delta)}; if(!next[id]) delete next[id]; setCart(next); localStorage.setItem('deccan-cart',JSON.stringify(next)); window.dispatchEvent(new Event('cart-updated')); }
  const count=Object.values(cart).reduce((sum,value)=>sum+value,0); const total=products.reduce((sum,product)=>sum+(cart[product.id]??0)*Number(product.price_myr),0);
  return <main className="menu-page">
    <CustomerHeader actionHref="/cart" actionAriaLabel={`View cart with ${count} items`} actionLabel={<>Cart {count > 0 && <span>{count}</span>} <b aria-hidden="true">→</b></>} />
    <div className="menu-wrap">
      <PageIntro eyebrow="Small-batch weekend kitchen" title="This weekend’s" accent="menu." description="Prepared in limited batches in Penang. Choose your dishes first, then select pickup or delivery." />
      {loading ? <p className="menu-state">Loading this weekend’s menu…</p> : products.length ? <div className="menu-grid">
        {products.map(product => <article className="menu-card customer-card" key={product.id}>
          {product.image_url && <img src={product.image_url} alt={product.name} />}
          <div className="menu-card-body">
            <div><h2>{product.name}</h2><p>{product.description}</p></div>
            <strong>RM{Number(product.price_myr).toFixed(2)}</strong>
            <div className="menu-card-actions" aria-label={`Quantity for ${product.name}`}>
              <button aria-label={`Remove one ${product.name}`} onClick={() => update(product.id,-1)} disabled={!cart[product.id]}>−</button>
              <span aria-live="polite">{cart[product.id] ?? 0}</span>
              <button aria-label={`Add one ${product.name}`} onClick={() => update(product.id,1)}>+</button>
            </div>
          </div>
        </article>)}
      </div> : <p className="menu-state">No dishes are available right now. Please check back for the next weekend menu.</p>}
      {count > 0 && <a className="button menu-continue" href="/cart"><span>View cart · {count} item{count===1?'':'s'}</span><strong>RM{total.toFixed(2)} →</strong></a>}
    </div>
  </main>;
}
