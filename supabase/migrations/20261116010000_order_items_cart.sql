create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price_myr numeric(10,2) not null check (unit_price_myr >= 0),
  line_total_myr numeric(10,2) not null check (line_total_myr >= 0),
  created_at timestamptz not null default now()
);
create index order_items_order_idx on public.order_items(order_id);
alter table public.order_items enable row level security;
create policy order_items_admin_read on public.order_items for select to authenticated using (public.is_admin());

create or replace function public.create_cart_order_reservation(
  p_idempotency_key uuid, p_items jsonb, p_service_date_id uuid, p_pickup_window_id uuid,
  p_customer_name text, p_whatsapp_phone text, p_public_token_hash text, p_payment_deadline timestamptz,
  p_fulfillment_type public.fulfillment_type default 'pickup', p_delivery_address text default null,
  p_delivery_postcode text default null, p_delivery_notes text default null
) returns table (order_id uuid, order_reference text, reservation_expires_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare v_item jsonb; v_product public.products%rowtype; v_service public.service_dates%rowtype; v_window public.pickup_windows%rowtype; v_existing public.orders%rowtype;
  v_order_id uuid; v_reference text; v_expires_at timestamptz; v_total_qty integer; v_total numeric(10,2); v_first_product uuid; v_first_price numeric(10,2); v_daily_used integer; v_window_used integer;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception using errcode='22023', message='At least one product is required'; end if;
  if nullif(trim(p_customer_name),'') is null or nullif(trim(p_whatsapp_phone),'') is null then raise exception using errcode='22023', message='Customer details are required'; end if;
  if p_fulfillment_type='delivery' and (nullif(trim(p_delivery_address),'') is null or nullif(trim(p_delivery_postcode),'') is null) then raise exception using errcode='22023', message='Delivery address and postcode are required'; end if;
  select * into v_existing from public.orders where idempotency_key=p_idempotency_key; if found then return query select v_existing.id,v_existing.order_reference,(select r.expires_at from public.reservations r where r.order_id=v_existing.id); end if;
  perform public.release_expired_reservations();
  select * into v_service from public.service_dates where id=p_service_date_id for update; if not found or not v_service.enabled then raise exception using errcode='22023',message='Service date is not available'; end if;
  if v_service.booking_deadline is not null and now() >= v_service.booking_deadline then raise exception using errcode='22023',message='Booking deadline has passed'; end if;
  select * into v_window from public.pickup_windows where id=p_pickup_window_id and service_date_id=p_service_date_id for update; if not found or not v_window.enabled then raise exception using errcode='22023',message='Pickup window is not available'; end if;
  v_total_qty := 0; v_total := 0; v_first_product := null;
  for v_item in select * from jsonb_array_elements(p_items) loop
    select * into v_product from public.products where id=(v_item->>'productId')::uuid and active=true; if not found then raise exception using errcode='22023',message='Product is not available'; end if;
    if (v_item->>'quantity')::integer < 1 then raise exception using errcode='22023',message='Invalid product quantity'; end if;
    if v_first_product is null then v_first_product:=v_product.id; v_first_price:=v_product.price_myr; end if;
    v_total_qty := v_total_qty + (v_item->>'quantity')::integer; v_total := v_total + v_product.price_myr * (v_item->>'quantity')::integer;
  end loop;
  select coalesce(sum(r.quantity),0)::integer into v_daily_used from reservations r where r.service_date_id=p_service_date_id and r.status='active' and r.expires_at>now(); select v_daily_used+coalesce(sum(o.quantity),0)::integer into v_daily_used from orders o where o.service_date_id=p_service_date_id and o.status in ('confirmed','collected');
  select coalesce(sum(r.quantity),0)::integer into v_window_used from reservations r where r.pickup_window_id=p_pickup_window_id and r.status='active' and r.expires_at>now(); select v_window_used+coalesce(sum(o.quantity),0)::integer into v_window_used from orders o where o.pickup_window_id=p_pickup_window_id and o.status in ('confirmed','collected');
  if v_daily_used+v_total_qty>v_service.daily_capacity then raise exception using errcode='P0001',message='Daily capacity is not available'; end if; if v_window_used+v_total_qty>v_window.capacity then raise exception using errcode='P0001',message='Pickup window capacity is not available'; end if;
  v_order_id:=gen_random_uuid(); v_reference:='DI-'||to_char(v_service.service_date,'YYYYMMDD')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,6)); v_expires_at:=least(coalesce(p_payment_deadline,now()+interval '30 minutes'),now()+interval '60 minutes');
  insert into orders(id,order_reference,customer_name,whatsapp_phone,product_id,service_date_id,pickup_window_id,quantity,unit_price_myr,total_myr,idempotency_key,public_token_hash,payment_deadline,fulfillment_type,delivery_status,delivery_address,delivery_postcode,delivery_notes) values(v_order_id,v_reference,trim(p_customer_name),trim(p_whatsapp_phone),v_first_product,p_service_date_id,p_pickup_window_id,v_total_qty,v_first_price,v_total,p_idempotency_key,p_public_token_hash,v_expires_at,p_fulfillment_type,case when p_fulfillment_type='delivery' then 'pending_review'::delivery_status else 'not_required'::delivery_status end,nullif(trim(p_delivery_address),''),nullif(trim(p_delivery_postcode),''),nullif(trim(p_delivery_notes),''));
  for v_item in select * from jsonb_array_elements(p_items) loop select * into v_product from products where id=(v_item->>'productId')::uuid; insert into order_items(order_id,product_id,product_name,quantity,unit_price_myr,line_total_myr) values(v_order_id,v_product.id,v_product.name,(v_item->>'quantity')::integer,v_product.price_myr,v_product.price_myr*(v_item->>'quantity')::integer); end loop;
  insert into reservations(order_id,service_date_id,pickup_window_id,quantity,expires_at) values(v_order_id,p_service_date_id,p_pickup_window_id,v_total_qty,v_expires_at); insert into order_events(order_id,event_type,to_status,note) values(v_order_id,'order_created','awaiting_payment','Cart order created'); return query select v_order_id,v_reference,v_expires_at;
end; $$;
revoke all on function public.create_cart_order_reservation(uuid,jsonb,uuid,uuid,text,text,text,timestamptz,public.fulfillment_type,text,text,text) from public,anon,authenticated;
grant execute on function public.create_cart_order_reservation(uuid,jsonb,uuid,uuid,text,text,text,timestamptz,public.fulfillment_type,text,text,text) to service_role;
