'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import './mobile-nav.css';

const Icon = ({ name }: { name:'home'|'menu'|'bag' }) => name === 'home' ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 10.5 12 3l8.5 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-4.5v-6h-5v6H5a1.5 1.5 0 0 1-1.5-1.5z"/></svg> : name === 'menu' ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6h14M5 12h14M5 18h14"/></svg> : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 13H6zM9 9V6a3 3 0 0 1 6 0v3"/></svg>;

export default function MobileNavigation() {
  const pathname = usePathname(); const [count,setCount] = useState(0);
  useEffect(() => { const sync = () => { try { const cart = JSON.parse(localStorage.getItem('deccan-cart') || '{}') as Record<string,number>; setCount(Object.values(cart).reduce((sum,value) => sum + Number(value), 0)); } catch { setCount(0); } }; sync(); window.addEventListener('storage',sync); window.addEventListener('cart-updated',sync); return () => { window.removeEventListener('storage',sync); window.removeEventListener('cart-updated',sync); }; }, [pathname]);
  if (pathname.startsWith('/admin') || pathname.startsWith('/order/') || pathname.startsWith('/pre-order')) return null;
  return <nav className="mobile-nav" aria-label="Primary navigation">
    <a className={pathname==='/'?'active':''} aria-current={pathname==='/'?'page':undefined} href="/"><Icon name="home"/><span>Home</span></a>
    <a className={pathname.startsWith('/menu')?'active':''} aria-current={pathname.startsWith('/menu')?'page':undefined} href="/menu"><Icon name="menu"/><span>Menu</span></a>
    <a className={pathname.startsWith('/cart')?'active mobile-nav-cart':'mobile-nav-cart'} aria-current={pathname.startsWith('/cart')?'page':undefined} href="/cart"><Icon name="bag"/><span>Cart</span>{count>0&&<b>{count}</b>}</a>
  </nav>;
}
