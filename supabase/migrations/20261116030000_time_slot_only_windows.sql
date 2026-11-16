-- Collection windows are time slots. The service date remains the sole capacity limit.
update public.pickup_windows w
set capacity = coalesce((select d.daily_capacity from public.service_dates d where d.id = w.service_date_id), 100000);
