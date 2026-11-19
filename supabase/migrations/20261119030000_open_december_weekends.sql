-- Open every Friday-Sunday service date in December 2026.
-- Each weekend closes for pre-orders on the preceding Thursday at 18:00 MYT.

insert into public.service_dates (
  service_date,
  enabled,
  daily_capacity,
  booking_deadline,
  notes
)
values
  ('2026-12-04', true, 15, '2026-12-03 18:00:00+08', 'December weekend service'),
  ('2026-12-05', true, 15, '2026-12-03 18:00:00+08', 'December weekend service'),
  ('2026-12-06', true, 15, '2026-12-03 18:00:00+08', 'December weekend service'),
  ('2026-12-11', true, 15, '2026-12-10 18:00:00+08', 'December weekend service'),
  ('2026-12-12', true, 15, '2026-12-10 18:00:00+08', 'December weekend service'),
  ('2026-12-13', true, 15, '2026-12-10 18:00:00+08', 'December weekend service'),
  ('2026-12-18', true, 15, '2026-12-17 18:00:00+08', 'December weekend service'),
  ('2026-12-19', true, 15, '2026-12-17 18:00:00+08', 'December weekend service'),
  ('2026-12-20', true, 15, '2026-12-17 18:00:00+08', 'December weekend service'),
  ('2026-12-25', true, 15, '2026-12-24 18:00:00+08', 'December weekend service'),
  ('2026-12-26', true, 15, '2026-12-24 18:00:00+08', 'December weekend service'),
  ('2026-12-27', true, 15, '2026-12-24 18:00:00+08', 'December weekend service')
on conflict (service_date) do update
set enabled = excluded.enabled,
    daily_capacity = excluded.daily_capacity,
    booking_deadline = excluded.booking_deadline,
    updated_at = now();

insert into public.pickup_windows (
  service_date_id,
  starts_at,
  ends_at,
  capacity,
  enabled
)
select
  service.id,
  slot.starts_at,
  slot.ends_at,
  15,
  true
from public.service_dates service
cross join (
  values
    ('12:00:00'::time, '12:30:00'::time),
    ('13:00:00'::time, '13:30:00'::time)
) as slot(starts_at, ends_at)
where service.service_date in (
  '2026-12-04', '2026-12-05', '2026-12-06',
  '2026-12-11', '2026-12-12', '2026-12-13',
  '2026-12-18', '2026-12-19', '2026-12-20',
  '2026-12-25', '2026-12-26', '2026-12-27'
)
on conflict (service_date_id, starts_at) do update
set ends_at = excluded.ends_at,
    capacity = excluded.capacity,
    enabled = excluded.enabled;
