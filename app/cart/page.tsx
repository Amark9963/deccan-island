'use client';
import { useEffect, useMemo, useState } from 'react';
import './cart.css';
import CustomerHeader from '../components/CustomerHeader';
import PageIntro from '../components/PageIntro';
type Product={id:string;name:string;price_myr:number;image_url?:string};
export default function CartPage(){const [products,setProducts]=useState<Product[]>([]),[cart,setCart]=useState<Record<string,number>>({});useEffect(()=>{fetch('/api/availability').then(response=>response.json()).then(data=>setProducts(data.dates?.[0]?.products??[])).catch(()=>setProducts([]));try{setCart(JSON.parse(localStorage.getItem('deccan-cart')||'{}'))}catch{setCart({})}},[]);const items=useMemo(()=>products.filter(product=>cart[product.id]).map(product=>({...product,quantity:cart[product.id]})),[products,cart]);const total=items.reduce((sum,item)=>sum+Number(item.price_myr)*item.quantity,0);const update=(id:string,delta:number)=>{const next={...cart,[id]:Math.max(0,(cart[id]??0)+delta)};if(!next[id])delete next[id];setCart(next);localStorage.setItem('deccan-cart',JSON.stringify(next));window.dispatchEvent(new Event('cart-updated'))};return <main className="cart-page">
  <CustomerHeader actionHref="/menu" actionLabel={<>Add more <b aria-hidden="true">＋</b></>} />
  <div className="cart-wrap">
    <PageIntro eyebrow="Your order" title="Almost ready" accent="for the table." />
    {items.length===0?<section className="cart-empty customer-card"><h2>Your cart is empty.</h2><p>Browse this weekend’s menu and add the dishes you would like us to prepare.</p><a className="button" href="/menu">Browse the menu <span>→</span></a></section>:<section className="cart-card customer-card">{items.map(item=><article className="cart-item" key={item.id}>{item.image_url&&<img src={item.image_url} alt=""/>}<div><h2>{item.name}</h2><p>RM{Number(item.price_myr).toFixed(2)} each</p><div className="cart-controls"><button onClick={()=>update(item.id,-1)} aria-label={`Remove one ${item.name}`}>−</button><strong>{item.quantity}</strong><button onClick={()=>update(item.id,1)} aria-label={`Add one ${item.name}`}>＋</button></div></div><b>RM{(Number(item.price_myr)*item.quantity).toFixed(2)}</b></article>)}<div className="cart-total"><span>Order total</span><strong>RM{total.toFixed(2)}</strong></div><p className="cart-next-note">Next, choose self-pickup or delivery and an available service date.</p><a className="button cart-continue" href="/pre-order">Choose pickup or delivery <span>→</span></a><a className="cart-edit" href="/menu">Continue browsing</a></section>}
  </div>
</main>}
