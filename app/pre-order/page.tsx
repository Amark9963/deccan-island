import PreOrderForm from './PreOrderForm';
import './pre-order.css';

export const metadata = { title: 'Pre-order | Deccan Island' };

export default function PreOrderPage() {
  return <main className="checkout-page"><header className="checkout-header"><a href="/" className="checkout-brand"><img src="/deccan-island-logo.svg" alt="Deccan Island — Hyderabadi Dum Kitchen" /></a><a href="/" className="checkout-back">← Back to home</a></header><PreOrderForm /></main>;
}
