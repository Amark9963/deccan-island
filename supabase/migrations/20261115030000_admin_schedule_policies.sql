-- Allow authenticated allowlisted admins to manage the weekend schedule.
create policy service_dates_admin_manage on public.service_dates
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy pickup_windows_admin_manage on public.pickup_windows
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
