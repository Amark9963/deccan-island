'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { track } from '@vercel/analytics';
import './cart.css';
import CustomerHeader from '../components/CustomerHeader';
import PageIntro from '../components/PageIntro';
import OptimizedFoodImage from '../components/OptimizedFoodImage';
import { resolveProductImage } from '@/lib/product-image';
import { formatServiceDate } from '@/lib/service-format';

type Product={id:string;name:string;price_myr:number;image_url?:string};
type DateProduct=Product&{remaining:number};
type ServiceDate={id:string;service_date:string;remaining:number;products:DateProduct[]};

export default function CartPage(){
  const [products,setProducts]=useState<Product[]>([]);
  const [dates,setDates]=useState<ServiceDate[]>([]);
  const [dateId,setDateId]=useState('');
  const [cart,setCart]=useState<Record<string,number>>({});
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(false);

  const loadCart=useCallback(()=>{
    setLoading(true);setError(false);
    fetch('/api/availability').then(async response=>{
      const data=await response.json();if(!response.ok)throw new Error(data.error);
      const availableDates=(data.dates??[]) as ServiceDate[];
      setProducts(data.products??[]);setDates(availableDates);
      const savedDate=localStorage.getItem('deccan-service-date');
      let savedCart:Record<string,number>={};try{savedCart=JSON.parse(localStorage.getItem('deccan-cart')||'{}')}catch{}
      const cartIds=Object.keys(savedCart).filter(id=>savedCart[id]>0);
      const compatibleDate=availableDates.find(date=>cartIds.every(id=>date.products.some(product=>product.id===id)));
      const initialDate=availableDates.some(date=>date.id===savedDate)?savedDate!:compatibleDate?.id??availableDates[0]?.id??'';
      setDateId(initialDate);if(initialDate)localStorage.setItem('deccan-service-date',initialDate);
    }).catch(()=>{setProducts([]);setDates([]);setError(true)}).finally(()=>setLoading(false));
  },[]);

  useEffect(()=>{loadCart();try{setCart(JSON.parse(localStorage.getItem('deccan-cart')||'{}'))}catch{setCart({})}},[loadCart]);

  const selectedDate=dates.find(date=>date.id===dateId);
  const items=useMemo(()=>products.filter(product=>cart[product.id]).map(product=>({...product,quantity:cart[product.id]})),[products,cart]);
  const totalQty=items.reduce((sum,item)=>sum+item.quantity,0);
  const total=items.reduce((sum,item)=>sum+Number(item.price_myr)*item.quantity,0);
  const unavailableItems=items.filter(item=>{const available=selectedDate?.products.find(product=>product.id===item.id);return !available||item.quantity>available.remaining});
  const canCheckout=Boolean(selectedDate&&items.length&&unavailableItems.length===0&&totalQty<=selectedDate.remaining);
  const update=(id:string,delta:number)=>{const available=selectedDate?.products.find(product=>product.id===id);if(delta>0&&(!available||(cart[id]??0)>=available.remaining||totalQty>=(selectedDate?.remaining??0)))return;const next={...cart,[id]:Math.max(0,(cart[id]??0)+delta)};if(!next[id])delete next[id];setCart(next);localStorage.setItem('deccan-cart',JSON.stringify(next));window.dispatchEvent(new Event('cart-updated'))};

  return <main className="cart-page">
    <CustomerHeader actionHref="/menu" actionLabel={<>Add more <b aria-hidden="true">＋</b></>} />
    <div className="cart-wrap">
      <PageIntro eyebrow="Your order" title="Almost ready" accent="for the table." />
      {loading?<section className="cart-state customer-card" aria-label="Loading cart"><strong>Checking your cart…</strong></section>:error?<section className="cart-state customer-card" role="alert"><strong>We couldn’t load your cart.</strong><p>Your saved selections are still on this device. Try loading the menu details again.</p><button className="state-retry" type="button" onClick={loadCart}>Try again</button></section>:items.length===0?<section className="cart-empty customer-card"><h2>Your cart is empty.</h2><p>Choose a service date and add the dishes you would like us to prepare.</p><a className="button" href="/menu">Browse the menu <span>→</span></a></section>:<section className="cart-card customer-card">
        {selectedDate&&<div className="cart-service-date"><div><span>Prepared for</span><strong>{formatServiceDate(selectedDate.service_date)}</strong></div><a href="/menu">Change date</a></div>}
        {items.map(item=>{const image=resolveProductImage(item);return <article className="cart-item" key={item.id}>{image&&<OptimizedFoodImage src={image} alt="" sizes="88px"/>}<div><h2>{item.name}</h2><p>RM{Number(item.price_myr).toFixed(2)} per portion</p><div className="cart-controls"><button onClick={()=>update(item.id,-1)} aria-label={`Remove one ${item.name}`}>−</button><strong>{item.quantity}</strong><button onClick={()=>update(item.id,1)} aria-label={`Add one ${item.name}`}>＋</button></div></div><b>RM{(Number(item.price_myr)*item.quantity).toFixed(2)}</b></article>})}
        <div className="cart-total"><span>Food subtotal</span><strong>RM{total.toFixed(2)}</strong></div>
        <p className="cart-next-note">Next, choose self-pickup or delivery. Pickup customers will then select a collection time.</p>
        {unavailableItems.length>0&&<div className="cart-closed-note"><strong>Your selected date has changed availability</strong><p>Return to the menu to remove or replace unavailable dishes before checkout.</p></div>}
        {canCheckout?<a className="button cart-continue" href="/pre-order" onClick={() => track('Begin Checkout', { items:totalQty, total_myr:Number(total.toFixed(2)) })}>Choose pickup or delivery <span>→</span></a>:<a className="button cart-continue" href="/menu">Review this date’s menu <span>→</span></a>}
        <a className="cart-edit" href="/menu">Continue browsing</a>
      </section>}
    </div>
  </main>;
}
