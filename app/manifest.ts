import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Deccan Island — Hyderabadi Dum Kitchen',
    short_name: 'Deccan Island',
    description: 'Small-batch Hyderabadi biryani and weekend dishes, prepared in Penang.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F7EEDD',
    theme_color: '#1F4A32',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
