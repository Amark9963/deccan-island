type ProductImageInput = {
  name: string;
  image_url?: string | null;
};

export function resolveProductImage(product:ProductImageInput) {
  const supplied = product.image_url?.trim();
  if (supplied) return supplied;

  const name = product.name.toLowerCase();
  if (name.includes('bagara') && name.includes('chicken')) return '/bagara-rice-chicken-curry.png';
  if (name.includes('fish') && name.includes('biryani')) return '/fish-biryani.png';
  if ((name.includes('veg') || name.includes('vegetable')) && name.includes('biryani')) return '/veg-biryani.png';
  if (name.includes('chicken') && name.includes('biryani')) return '/chicken-dum-biryani.png';
  return undefined;
}
