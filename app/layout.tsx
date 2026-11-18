import './globals.css';
import './brand-overrides.css';
import './mobile-polish.css';
import './premium-mobile.css';
import './customer-experience.css';
import type { Metadata } from 'next';
import MobileNavigation from './MobileNavigation';

export const metadata: Metadata = { title: 'Deccan Island — Hyderabadi Dum Kitchen', description: 'Weekend Hyderabadi dum biryani, prepared in small batches on Penang Island.' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}<MobileNavigation /></body></html>;
}
