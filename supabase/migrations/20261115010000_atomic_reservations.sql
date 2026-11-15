-- Atomic reservation primitives for the public checkout endpoint.

create or replace function public.release_expired_reservations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  released_count integer;
begin
  update public.reservations
     set status = 'expired', released_at = now()
   where status = 'active'
     and expires_at <= now();
  get diagnostics released_count = row_count;
  return released_count;
end;
$$;

create or replace function public.create_order_reservation(
  p_idempotency_key uuid,
  p_product_id uuid,
  p_service_date_id uuid,
  p_pickup_window_id uuid,
  p_quantity integer,
  p_customer_name text,
  p_whatsapp_phone text,
  p_public_token_hash text,
  p_payment_deadline timestamptz
)
returns table (
  order_id uuid,
  order_reference text,
  reservation_expires_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product public.products%rowtype;
  v_service public.service_dates%rowtype;
  v_window public.pickup_windows%rowtype;
  v_existing public.orders%rowtype;
  v_order_id uuid;
  v_reference text;
  v_expires_at timestamptz;
  v_daily_used integer;
  v_window_used integer;
begin
  if p_quantity is null or p_quantity <= 0 then
    raise exception using errcode = '22023', message = 'Quantity must be greater than zero';
  end if;
  if nullif(trim(p_customer_name), '') is null then
    raise exception using errcode = '22023', message = 'Customer name is required';
  end if;
  if nullif(trim(p_whatsapp_phone), '') is null then
    raise exception using errcode = '22023', message = 'WhatsApp phone is required';
  end if;
  if nullif(trim(p_public_token_hash), '') is null then
    raise exception using errcode = '22023', message = 'Public token hash is required';
  end if;

  select * into v_existing from public.orders where idempotency_key = p_idempotency_key;
  if found then
    return query select v_existing.id, v_existing.order_reference,
      (select r.expires_at from public.reservations r where r.order_id = v_existing.id);
    return;
  end if;

  perform public.release_expired_reservations();

  -- Lock both capacity rows so concurrent requests serialize for this service slot.
  select * into v_service from public.service_dates where id = p_service_date_id for update;
  if not found or not v_service.enabled then
    raise exception using errcode = '22023', message = 'Service date is not available';
  end if;
  if v_service.booking_deadline is not null and now() >= v_service.booking_deadline then
    raise exception using errcode = '22023', message = 'Booking deadline has passed';
  end if;

  select * into v_window from public.pickup_windows
   where id = p_pickup_window_id and service_date_id = p_service_date_id for update;
  if not found or not v_window.enabled then
    raise exception using errcode = '22023', message = 'Pickup window is not available';
  end if;

  select * into v_product from public.products where id = p_product_id and active = true;
  if not found then
    raise exception using errcode = '22023', message = 'Product is not available';
  end if;

  select coalesce(sum(r.quantity), 0)::integer into v_daily_used
    from public.reservations r
   where r.service_date_id = p_service_date_id
     and r.status = 'active'
     and r.expires_at > now();
  select v_daily_used + coalesce(sum(o.quantity), 0)::integer into v_daily_used
    from public.orders o
   where o.service_date_id = p_service_date_id
     and o.status in ('confirmed', 'collected');

  select coalesce(sum(r.quantity), 0)::integer into v_window_used
    from public.reservations r
   where r.pickup_window_id = p_pickup_window_id
     and r.status = 'active'
     and r.expires_at > now();
  select v_window_used + coalesce(sum(o.quantity), 0)::integer into v_window_used
    from public.orders o
   where o.pickup_window_id = p_pickup_window_id
     and o.status in ('confirmed', 'collected');

  if v_daily_used + p_quantity > v_service.daily_capacity then
    raise exception using errcode = 'P0001', message = 'Daily capacity is not available';
  end if;
  if v_window_used + p_quantity > v_window.capacity then
    raise exception using errcode = 'P0001', message = 'Pickup window capacity is not available';
  end if;

  v_order_id := gen_random_uuid();
  v_reference := 'DI-' || to_char(v_service.service_date, 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  v_expires_at := least(coalesce(p_payment_deadline, now() + interval '30 minutes'), now() + interval '60 minutes');

  insert into public.orders (
    id, order_reference, customer_name, whatsapp_phone, product_id,
    service_date_id, pickup_window_id, quantity, unit_price_myr,
    total_myr, idempotency_key, public_token_hash, payment_deadline
  ) values (
    v_order_id, v_reference, trim(p_customer_name), trim(p_whatsapp_phone), p_product_id,
    p_service_date_id, p_pickup_window_id, p_quantity, v_product.price_myr,
    v_product.price_myr * p_quantity, p_idempotency_key, p_public_token_hash, v_expires_at
  );

  insert into public.reservations (order_id, service_date_id, pickup_window_id, quantity, expires_at)
  values (v_order_id, p_service_date_id, p_pickup_window_id, p_quantity, v_expires_at);

  insert into public.order_events (order_id, event_type, to_status, note)
  values (v_order_id, 'order_created', 'awaiting_payment', 'Temporary inventory reservation created');

  return query select v_order_id, v_reference, v_expires_at;
exception
  when unique_violation then
    select * into v_existing from public.orders where idempotency_key = p_idempotency_key;
    if found then
      return query select v_existing.id, v_existing.order_reference,
        (select r.expires_at from public.reservations r where r.order_id = v_existing.id);
    else
      raise;
    end if;
end;
$$;

revoke all on function public.release_expired_reservations() from public, anon, authenticated;
revoke all on function public.create_order_reservation(uuid, uuid, uuid, uuid, integer, text, text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.release_expired_reservations() to service_role;
grant execute on function public.create_order_reservation(uuid, uuid, uuid, uuid, integer, text, text, text, timestamptz) to service_role;
