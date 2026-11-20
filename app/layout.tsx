import './globals.css';
import './brand-overrides.css';
import './mobile-polish.css';
import './premium-mobile.css';
import './customer-experience.css';
import type { Metadata } from 'next';
import MobileNavigation from './MobileNavigation';

const siteUrl = 'https://www.deccanisland.com';
const siteDescription = 'Small-batch Hyderabadi biryani and weekend dishes, prepared from our home kitchen in Penang for pre-order, pickup or delivery request.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Deccan Island | Hyderabadi Biryani in Penang',
    template: '%s | Deccan Island',
  },
  description: siteDescription,
  applicationName: 'Deccan Island',
  keywords: [
    'Hyderabadi biryani Penang',
    'chicken dum biryani Penang',
    'homemade biryani Penang',
    'Indian food Penang',
    'weekend food pre-order Penang',
  ],
  authors: [{ name: 'Deccan Island', url: siteUrl }],
  creator: 'Deccan Island',
  publisher: 'Deccan Island',
  alternates: { canonical: '/' },
  icons: { icon: '/deccan-island-logo.svg', shortcut: '/deccan-island-logo.svg' },
  manifest: '/manifest.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en_MY',
    url: siteUrl,
    siteName: 'Deccan Island',
    title: 'Deccan Island | Hyderabadi Biryani in Penang',
    description: siteDescription,
    images: [{
      url: '/opengraph-image',
      width: 1200,
      height: 630,
      alt: 'Deccan Island — Hyderabadi dum kitchen in Penang',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Deccan Island | Hyderabadi Biryani in Penang',
    description: siteDescription,
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
};

const businessStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'FoodEstablishment',
  '@id': `${siteUrl}/#business`,
  name: 'Deccan Island',
  description: siteDescription,
  url: siteUrl,
  logo: `${siteUrl}/deccan-island-logo.svg`,
  image: [
    `${siteUrl}/chicken-dum-biryani.png`,
    `${siteUrl}/bagara-rice-chicken-curry.png`,
    `${siteUrl}/fish-biryani.png`,
  ],
  telephone: '+601126466354',
  priceRange: 'RM',
  servesCuisine: ['Hyderabadi', 'Indian', 'Biryani'],
  areaServed: {
    '@type': 'Place',
    name: 'Penang Island, Malaysia',
  },
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Penang',
    addressRegion: 'Penang',
    addressCountry: 'MY',
  },
  hasMenu: `${siteUrl}/menu`,
  sameAs: ['https://www.instagram.com/deccanisland/'],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en-MY"><body><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessStructuredData) }} />{children}<MobileNavigation /></body></html>;
}
