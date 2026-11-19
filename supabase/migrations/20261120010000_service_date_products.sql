create table public.service_date_products (
  service_date_id uuid not null references public.service_dates(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  capacity integer not null check (capacity > 0),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (service_date_id, product_id)
);

create index service_date_products_product_idx on public.service_date_products(product_id);
create trigger service_date_products_set_updated_at before update on public.service_date_products for each row execute function public.set_updated_at();

alter table public.service_date_products enable row level security;
create policy service_date_products_public_read on public.service_date_products for select to anon, authenticated using (
  enabled
  and exists (select 1 from public.service_dates d where d.id = service_date_id and d.enabled)
  and exists (select 1 from public.products p where p.id = product_id and p.active)
);
create policy service_date_products_admin_manage on public.service_date_products for all to authenticated using (public.is_admin()) with check (public.is_admin());

insert into public.service_date_products (service_date_id, product_id, capacity, enabled)
select d.id, p.id,
  case
    when extract(dow from d.service_date) = 0 and lower(p.name) like '%chicken%' and lower(p.name) like '%biryani%' then 8
    when extract(dow from d.service_date) = 0 and lower(p.name) like '%fish%' and lower(p.name) like '%biryani%' then 3
    when extract(dow from d.service_date) = 0 and lower(p.name) like '%bagara%' then 4
    else 15
  end,
  true
from public.service_dates d
cross join public.products p
where d.service_date >= current_date
  and (
    (lower(p.name) like '%chicken%' and lower(p.name) like '%biryani%')
    or (extract(dow from d.service_date) = 0 and lower(p.name) like '%fish%' and lower(p.name) like '%biryani%')
    or (extract(dow from d.service_date) = 0 and lower(p.name) like '%bagara%')
  )
on conflict (service_date_id, product_id) do update set capacity = excluded.capacity, enabled = true;

create or replace function public.get_service_date_product_availability()
returns table (service_date_id uuid, product_id uuid, capacity integer, remaining integer, daily_remaining integer)
language sql stable security definer set search_path = public as $$
  select
    sdp.service_date_id,
    sdp.product_id,
    sdp.capacity,
    greatest(sdp.capacity - coalesce((
      select sum(oi.quantity)::integer
      from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where o.service_date_id = sdp.service_date_id
        and oi.product_id = sdp.product_id
        and (
          o.status in ('confirmed', 'collected')
          or (
            o.status not in ('cancelled', 'expired')
            and exists (
              select 1 from public.reservations r
              where r.order_id = o.id and r.status = 'active' and r.expires_at > now()
            )
          )
        )
    ), 0), 0)::integer as remaining,
    greatest(d.daily_capacity - coalesce((
      select sum(o.quantity)::integer
      from public.orders o
      where o.service_date_id = sdp.service_date_id
        and (
          o.status in ('confirmed', 'collected')
          or (
            o.status not in ('cancelled', 'expired')
            and exists (
              select 1 from public.reservations r
              where r.order_id = o.id and r.status = 'active' and r.expires_at > now()
            )
          )
        )
    ), 0), 0)::integer as daily_remaining
  from public.service_date_products sdp
  join public.service_dates d on d.id = sdp.service_date_id
  join public.products p on p.id = sdp.product_id
  where sdp.enabled and d.enabled and p.active
    and d.service_date >= current_date
    and (d.booking_deadline is null or d.booking_deadline > now());
$$;
revoke all on function public.get_service_date_product_availability() from public, anon, authenticated;
grant execute on function public.get_service_date_product_availability() to service_role;

create or replace function public.create_cart_order_reservation(
  p_idempotency_key uuid, p_items jsonb, p_service_date_id uuid, p_pickup_window_id uuid,
  p_customer_name text, p_whatsapp_phone text, p_public_token_hash text, p_payment_deadline timestamptz,
  p_fulfillment_type public.fulfillment_type default 'pickup', p_delivery_address text default null,
  p_delivery_postcode text default null, p_delivery_notes text default null
) returns table (order_id uuid, order_reference text, reservation_expires_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare
  v_item jsonb; v_product public.products%rowtype; v_date_product public.service_date_products%rowtype;
  v_service public.service_dates%rowtype; v_window public.pickup_windows%rowtype; v_existing public.orders%rowtype;
  v_order_id uuid; v_reference text; v_expires_at timestamptz; v_total_qty integer; v_total numeric(10,2);
  v_first_product uuid; v_first_price numeric(10,2); v_daily_used integer; v_window_used integer;
  v_product_used integer; v_requested integer;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception using errcode='22023', message='At least one product is required'; end if;
  if (select count(*) from jsonb_array_elements(p_items)) <> (select count(distinct item->>'productId') from jsonb_array_elements(p_items) as x(item)) then raise exception using errcode='22023', message='Duplicate products are not allowed'; end if;
  if nullif(trim(p_customer_name),'') is null or nullif(trim(p_whatsapp_phone),'') is null then raise exception using errcode='22023', message='Customer details are required'; end if;
  if p_fulfillment_type='delivery' and (nullif(trim(p_delivery_address),'') is null or nullif(trim(p_delivery_postcode),'') is null) then raise exception using errcode='22023', message='Delivery address and postcode are required'; end if;
  if p_fulfillment_type='pickup' and p_pickup_window_id is null then raise exception using errcode='22023', message='Collection time is required'; end if;
  select * into v_existing from public.orders where idempotency_key=p_idempotency_key;
  if found then return query select v_existing.id,v_existing.order_reference,(select r.expires_at from public.reservations r where r.order_id=v_existing.id); return; end if;

  perform public.release_expired_reservations();
  select * into v_service from public.service_dates where id=p_service_date_id for update;
  if not found or not v_service.enabled then raise exception using errcode='22023',message='Service date is not available'; end if;
  if v_service.booking_deadline is not null and now() >= v_service.booking_deadline then raise exception using errcode='22023',message='Booking deadline has passed'; end if;
  if p_fulfillment_type='pickup' then
    select * into v_window from public.pickup_windows where id=p_pickup_window_id and service_date_id=p_service_date_id for update;
    if not found or not v_window.enabled then raise exception using errcode='22023',message='Collection time is not available'; end if;
  end if;

  v_total_qty := 0; v_total := 0; v_first_product := null;
  for v_item in select item from jsonb_array_elements(p_items) as x(item) order by item->>'productId' loop
    select * into v_product from public.products where id=(v_item->>'productId')::uuid and active=true;
    if not found then raise exception using errcode='22023',message='Product is not available'; end if;
    v_requested := (v_item->>'quantity')::integer;
    if v_requested < 1 then raise exception using errcode='22023',message='Invalid product quantity'; end if;
    select * into v_date_product from public.service_date_products where service_date_id=p_service_date_id and product_id=v_product.id and enabled for update;
    if not found then raise exception using errcode='22023',message=v_product.name || ' is not offered on this date'; end if;
    select coalesce(sum(oi.quantity),0)::integer into v_product_used
    from public.order_items oi join public.orders o on o.id=oi.order_id
    where o.service_date_id=p_service_date_id and oi.product_id=v_product.id
      and (o.status in ('confirmed','collected') or (o.status not in ('cancelled','expired') and exists (select 1 from public.reservations r where r.order_id=o.id and r.status='active' and r.expires_at>now())));
    if v_product_used+v_requested>v_date_product.capacity then raise exception using errcode='P0001',message=v_product.name || ' has sold out for this date'; end if;
    if v_first_product is null then v_first_product:=v_product.id; v_first_price:=v_product.price_myr; end if;
    v_total_qty := v_total_qty + v_requested;
    v_total := v_total + v_product.price_myr * v_requested;
  end loop;

  select coalesce(sum(o.quantity),0)::integer into v_daily_used from public.orders o
  where o.service_date_id=p_service_date_id
    and (o.status in ('confirmed','collected') or (o.status not in ('cancelled','expired') and exists (select 1 from public.reservations r where r.order_id=o.id and r.status='active' and r.expires_at>now())));
  if v_daily_used+v_total_qty>v_service.daily_capacity then raise exception using errcode='P0001',message='This service date has sold out'; end if;

  if p_fulfillment_type='pickup' then
    select coalesce(sum(o.quantity),0)::integer into v_window_used from public.orders o
    where o.pickup_window_id=p_pickup_window_id
      and (o.status in ('confirmed','collected') or (o.status not in ('cancelled','expired') and exists (select 1 from public.reservations r where r.order_id=o.id and r.status='active' and r.expires_at>now())));
    if v_window_used+v_total_qty>v_window.capacity then raise exception using errcode='P0001',message='Collection time is not available'; end if;
  end if;

  v_order_id:=gen_random_uuid();
  v_reference:='DI-'||to_char(v_service.service_date,'YYYYMMDD')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
  v_expires_at:=least(coalesce(p_payment_deadline,now()+interval '30 minutes'),now()+interval '60 minutes');
  insert into public.orders(id,order_reference,customer_name,whatsapp_phone,product_id,service_date_id,pickup_window_id,quantity,unit_price_myr,total_myr,idempotency_key,public_token_hash,payment_deadline,fulfillment_type,delivery_status,delivery_address,delivery_postcode,delivery_notes)
  values(v_order_id,v_reference,trim(p_customer_name),trim(p_whatsapp_phone),v_first_product,p_service_date_id,case when p_fulfillment_type='pickup' then p_pickup_window_id else null end,v_total_qty,v_first_price,v_total,p_idempotency_key,p_public_token_hash,v_expires_at,p_fulfillment_type,case when p_fulfillment_type='delivery' then 'pending_review'::public.delivery_status else 'not_required'::public.delivery_status end,nullif(trim(p_delivery_address),''),nullif(trim(p_delivery_postcode),''),nullif(trim(p_delivery_notes),''));
  for v_item in select item from jsonb_array_elements(p_items) as x(item) loop
    select * into v_product from public.products where id=(v_item->>'productId')::uuid;
    insert into public.order_items(order_id,product_id,product_name,quantity,unit_price_myr,line_total_myr)
    values(v_order_id,v_product.id,v_product.name,(v_item->>'quantity')::integer,v_product.price_myr,v_product.price_myr*(v_item->>'quantity')::integer);
  end loop;
  insert into public.reservations(order_id,service_date_id,pickup_window_id,quantity,expires_at)
  values(v_order_id,p_service_date_id,case when p_fulfillment_type='pickup' then p_pickup_window_id else null end,v_total_qty,v_expires_at);
  insert into public.order_events(order_id,event_type,to_status,note)
  values(v_order_id,'order_created','awaiting_payment',case when p_fulfillment_type='delivery' then 'Delivery request created' else 'Pickup order created' end);
  return query select v_order_id,v_reference,v_expires_at;
end; $$;
revoke all on function public.create_cart_order_reservation(uuid,jsonb,uuid,uuid,text,text,text,timestamptz,public.fulfillment_type,text,text,text) from public,anon,authenticated;
grant execute on function public.create_cart_order_reservation(uuid,jsonb,uuid,uuid,text,text,text,timestamptz,public.fulfillment_type,text,text,text) to service_role;

