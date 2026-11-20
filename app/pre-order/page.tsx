import PreOrderForm from './PreOrderForm';
import './pre-order.css';
import CustomerHeader from '../components/CustomerHeader';

export const metadata = {
  title: 'Complete Your Pre-order',
  robots: { index: false, follow: false },
};

export default function PreOrderPage() {
  return <main className="checkout-page"><CustomerHeader actionHref="/cart" actionLabel={<>← Back to cart</>} /><div className="checkout-wrap"><div className="checkout-card customer-card"><PreOrderForm /></div></div></main>;
}
