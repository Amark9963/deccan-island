insert into public.products (slug, name, description, price_myr, image_url, active)
values (
  'veg-biryani',
  'Veg Biryani',
  'Long-grain basmati rice with vegetables and aromatic spices.',
  17.00,
  '/veg-biryani.png',
  true
)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  price_myr = excluded.price_myr,
  image_url = excluded.image_url,
  active = true;

insert into public.service_date_products (service_date_id, product_id, capacity, enabled)
select d.id, p.id, 5, true
from public.service_dates d
join public.products p on p.slug = 'veg-biryani'
where d.service_date >= current_date
on conflict (service_date_id, product_id) do update set capacity = 5, enabled = true;

