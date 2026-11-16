'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import './mobile-nav.css';
export default function MobileNavigation() {
  const pathname = usePathname(); const [count, setCount] = useState(0);
  useEffect(() => { const sync = () => { try { const cart = JSON.parse(localStorage.getItem('deccan-cart') || '{}') as Record<string, number>; setCount(Object.values(cart).reduce((sum, value) => sum + Number(value), 0)); } catch { setCount(0); } }; sync(); window.addEventListener('storage', sync); window.addEventListener('cart-updated', sync); return () => { window.removeEventListener('storage', sync); window.removeEventListener('cart-updated', sync); }; }, [pathname]);
  if (pathname.startsWith('/admin') || pathname.startsWith('/order/')) return null;
  return <nav className="mobile-nav" aria-label="Mobile navigation"><a className={pathname === '/' ? 'active' : ''} href="/"><span>⌂</span>Home</a><a className={pathname.startsWith('/menu') ? 'active' : ''} href="/menu"><span>☷</span>Menu</a><a className={pathname.startsWith('/cart') ? 'active mobile-nav-cart' : 'mobile-nav-cart'} href="/cart"><span>＋</span>Cart{count > 0 && <b>{count}</b>}</a><a className={pathname.startsWith('/pre-order') ? 'active' : ''} href="/pre-order"><span>→</span>Checkout</a></nav>;
}
