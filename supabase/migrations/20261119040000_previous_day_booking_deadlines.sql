-- Give each remaining November and December service date its own
-- previous-day 18:00 MYT booking deadline.

update public.service_dates
set booking_deadline = ((service_date - 1) + time '18:00') at time zone 'Asia/Kuala_Lumpur',
    updated_at = now()
where service_date in (
  '2026-11-27', '2026-11-28', '2026-11-29',
  '2026-12-04', '2026-12-05', '2026-12-06',
  '2026-12-11', '2026-12-12', '2026-12-13',
  '2026-12-18', '2026-12-19', '2026-12-20',
  '2026-12-25', '2026-12-26', '2026-12-27'
);
