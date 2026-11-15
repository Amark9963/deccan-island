-- Deccan Island MVP foundation
-- All timestamps are stored as timestamptz; application scheduling uses Asia/Kuala_Lumpur.

create extension if not exists pgcrypto;

create type public.order_status as enum ('awaiting_payment', 'payment_under_review', 'confirmed', 'collected', 'expired', 'cancelled');
create type public.payment_status as enum ('unpaid', 'reported', 'verified', 'refunded');
create type public.reservation_status as enum ('active', 'released', 'converted', 'expired', 'cancelled');

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  price_myr numeric(10,2) not null check (price_myr >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.service_dates (
  id uuid primary key default gen_random_uuid(),
  service_date date not null unique,
  timezone text not null default 'Asia/Kuala_Lumpur',
  enabled boolean not null default false,
  daily_capacity integer not null default 15 check (daily_capacity > 0),
  booking_deadline timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pickup_windows (
  id uuid primary key default gen_random_uuid(),
  service_date_id uuid not null references public.service_dates(id) on delete cascade,
  starts_at time not null,
  ends_at time not null,
  capacity integer not null check (capacity > 0),
  enabled boolean not null default true,
  unique(service_date_id, starts_at),
  check (ends_at > starts_at)
);

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_reference text not null unique,
  status public.order_status not null default 'awaiting_payment',
  payment_status public.payment_status not null default 'unpaid',
  customer_name text not null,
  whatsapp_phone text not null,
  product_id uuid not null references public.products(id),
  service_date_id uuid not null references public.service_dates(id),
  pickup_window_id uuid not null references public.pickup_windows(id),
  quantity integer not null check (quantity > 0),
  unit_price_myr numeric(10,2) not null check (unit_price_myr >= 0),
  total_myr numeric(10,2) not null check (total_myr >= 0),
  idempotency_key uuid not null unique,
  public_token_hash text not null unique,
  payment_deadline timestamptz,
  payment_reported_at timestamptz,
  payment_verified_at timestamptz,
  confirmed_at timestamptz,
  collected_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  pickup_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  service_date_id uuid not null references public.service_dates(id),
  pickup_window_id uuid not null references public.pickup_windows(id),
  quantity integer not null check (quantity > 0),
  status public.reservation_status not null default 'active',
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  released_at timestamptz
);

create table public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  event_type text not null,
  from_status text,
  to_status text,
  note text,
  actor_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.admin_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create index service_dates_enabled_idx on public.service_dates(service_date) where enabled = true;
create index pickup_windows_date_idx on public.pickup_windows(service_date_id);
create index orders_service_date_idx on public.orders(service_date_id);
create index orders_status_idx on public.orders(status);
create index reservations_active_expiry_idx on public.reservations(expires_at) where status = 'active';
create index order_events_order_idx on public.order_events(order_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_set_updated_at before update on public.products for each row execute function public.set_updated_at();
create trigger service_dates_set_updated_at before update on public.service_dates for each row execute function public.set_updated_at();
create trigger orders_set_updated_at before update on public.orders for each row execute function public.set_updated_at();
create trigger admin_settings_set_updated_at before update on public.admin_settings for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

alter table public.products enable row level security;
alter table public.service_dates enable row level security;
alter table public.pickup_windows enable row level security;
alter table public.admin_users enable row level security;
alter table public.orders enable row level security;
alter table public.reservations enable row level security;
alter table public.order_events enable row level security;
alter table public.admin_settings enable row level security;

create policy products_public_read on public.products for select to anon, authenticated using (active = true);
create policy service_dates_public_read on public.service_dates for select to anon, authenticated using (enabled = true);
create policy pickup_windows_public_read on public.pickup_windows for select to anon, authenticated using (enabled = true and exists (select 1 from public.service_dates d where d.id = service_date_id and d.enabled = true));

create policy admin_users_self_read on public.admin_users for select to authenticated using (user_id = auth.uid());
create policy admin_users_admin_manage on public.admin_users for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy orders_admin_read on public.orders for select to authenticated using (public.is_admin());
create policy orders_admin_update on public.orders for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy reservations_admin_read on public.reservations for select to authenticated using (public.is_admin());
create policy order_events_admin_read on public.order_events for select to authenticated using (public.is_admin());
create policy admin_settings_admin_manage on public.admin_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

insert into public.products (slug, name, description, price_myr)
values ('hyderabadi-chicken-dum-biryani', 'Hyderabadi Chicken Dum Biryani', 'Chicken dum biryani with one chicken drumstick and raita.', 22.00)
on conflict (slug) do nothing;

comment on table public.orders is 'Customer orders. Public creation will happen through a server-side atomic reservation function.';
comment on column public.orders.public_token_hash is 'Hash of the unguessable customer status token; never expose this hash publicly.';
comment on table public.reservations is 'Temporary inventory holds; active rows count toward daily and pickup-window capacity until converted or released.';
