import MenuClient from './MenuClient';
import './menu.css';
import { getAvailability } from '@/lib/availability';
import { resolveProductImage } from '@/lib/product-image';

export const dynamic = 'force-dynamic';

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

export default async function MenuPage() {
  let initialData;
  try {
    initialData = await getAvailability();
  } catch (error) {
    console.error('menu_initial_availability_error', error);
  }

  const menuStructuredData = initialData ? {
    '@context': 'https://schema.org',
    '@type': 'Menu',
    name: 'Deccan Island Weekend Menu',
    url: 'https://www.deccanisland.com/menu',
    hasMenuSection: [{
      '@type': 'MenuSection',
      name: 'Weekend dishes',
      hasMenuItem: initialData.products.map(product => {
        const image = resolveProductImage(product);
        return {
          '@type': 'MenuItem',
          name: product.name,
          description: product.description,
          ...(image ? { image: image.startsWith('http') ? image : `https://www.deccanisland.com${image}` } : {}),
          offers: {
            '@type': 'Offer',
            price: Number(product.price_myr).toFixed(2),
            priceCurrency: 'MYR',
            availability: 'https://schema.org/InStock',
          },
        };
      }),
    }],
  } : null;

  return <>{menuStructuredData && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(menuStructuredData) }} />}<MenuClient initialData={initialData} /></>;
}
