'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import './cart.css';
import CustomerHeader from '../components/CustomerHeader';
import PageIntro from '../components/PageIntro';
import OptimizedFoodImage from '../components/OptimizedFoodImage';
import { resolveProductImage } from '@/lib/product-image';

type Product={id:string;name:string;price_myr:number;image_url?:string};

export default function CartPage(){
  const [products,setProducts]=useState<Product[]>([]);
  const [datesAvailable,setDatesAvailable]=useState(false);
  const [cart,setCart]=useState<Record<string,number>>({});
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(false);

  const loadCart=useCallback(()=>{
    setLoading(true);
    setError(false);
    fetch('/api/availability').then(async response=>{
      const data=await response.json();
      if(!response.ok) throw new Error(data.error);
      setProducts(data.products??[]);
      setDatesAvailable(Boolean(data.dates?.length));
    }).catch(()=>{
      setProducts([]);
      setDatesAvailable(false);
      setError(true);
    }).finally(()=>setLoading(false));
  },[]);

  useEffect(()=>{
    loadCart();
    try{setCart(JSON.parse(localStorage.getItem('deccan-cart')||'{}'))}catch{setCart({})}
  },[loadCart]);

  const items=useMemo(()=>products.filter(product=>cart[product.id]).map(product=>({...product,quantity:cart[product.id]})),[products,cart]);
  const total=items.reduce((sum,item)=>sum+Number(item.price_myr)*item.quantity,0);
  const update=(id:string,delta:number)=>{const next={...cart,[id]:Math.max(0,(cart[id]??0)+delta)};if(!next[id])delete next[id];setCart(next);localStorage.setItem('deccan-cart',JSON.stringify(next));window.dispatchEvent(new Event('cart-updated'))};

  return <main className="cart-page">
    <CustomerHeader actionHref="/menu" actionLabel={<>Add more <b aria-hidden="true">＋</b></>} />
    <div className="cart-wrap">
      <PageIntro eyebrow="Your order" title="Almost ready" accent="for the table." />
      {loading?<section className="cart-state customer-card" aria-label="Loading cart"><strong>Checking your cart…</strong></section>:error?<section className="cart-state customer-card" role="alert"><strong>We couldn’t load your cart.</strong><p>Your saved selections are still on this device. Try loading the menu details again.</p><button className="state-retry" type="button" onClick={loadCart}>Try again</button></section>:items.length===0?<section className="cart-empty customer-card"><h2>Your cart is empty.</h2><p>Browse this weekend’s menu and add the dishes you would like us to prepare.</p><a className="button" href="/menu">Browse the menu <span>→</span></a></section>:<section className="cart-card customer-card">{items.map(item=>{const image=resolveProductImage(item);return <article className="cart-item" key={item.id}>{image&&<OptimizedFoodImage src={image} alt="" sizes="88px"/>}<div><h2>{item.name}</h2><p>RM{Number(item.price_myr).toFixed(2)} per portion</p><div className="cart-controls"><button onClick={()=>update(item.id,-1)} aria-label={`Remove one ${item.name}`}>−</button><strong>{item.quantity}</strong><button onClick={()=>update(item.id,1)} aria-label={`Add one ${item.name}`} disabled={!datesAvailable}>＋</button></div></div><b>RM{(Number(item.price_myr)*item.quantity).toFixed(2)}</b></article>})}<div className="cart-total"><span>Food subtotal</span><strong>RM{total.toFixed(2)}</strong></div><p className="cart-next-note">Next, choose self-pickup or delivery and an available service date. Delivery rider fees are confirmed separately.</p>{datesAvailable?<a className="button cart-continue" href="/pre-order">Choose pickup or delivery <span>→</span></a>:<div className="cart-closed-note"><strong>Next service date coming soon</strong><p>Your cart is saved. Checkout will reopen when the next service date is published.</p></div>}<a className="cart-edit" href="/menu">Continue browsing</a></section>}
    </div>
  </main>;
}
