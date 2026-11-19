import Image from 'next/image';

type OptimizedFoodImageProps = {
  src: string;
  alt: string;
  className?: string;
  sizes: string;
  priority?: boolean;
};

export default function OptimizedFoodImage({ src, alt, className, sizes, priority = false }: OptimizedFoodImageProps) {
  if (!src.startsWith('/')) {
    return <img src={src} alt={alt} className={className} loading={priority ? 'eager' : 'lazy'} decoding="async" />;
  }

  return <Image src={src} alt={alt} className={className} width={1200} height={1000} sizes={sizes} priority={priority} />;
}
