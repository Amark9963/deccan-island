import MenuClient from './MenuClient';
import './menu.css';
export const metadata = {
  title: 'Weekend Menu',
  description: 'Browse Deccan Island’s small-batch weekend menu in Penang, including Hyderabadi Chicken Dum Biryani and rotating Sunday dishes.',
  alternates: { canonical: '/menu' },
  openGraph: {
    title: 'Weekend Menu | Deccan Island',
    description: 'Choose from our small-batch weekend menu, prepared in Penang for pre-order.',
    url: '/menu',
  },
};
export default function MenuPage() { return <MenuClient />; }
