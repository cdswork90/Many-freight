-- Apply immediately after 002. Keep private shipper contact details tenant-scoped.
drop view if exists public.marketplace_open_listings;
drop policy if exists marketplace_loads_read on public.marketplace_loads;
create policy marketplace_loads_read on public.marketplace_loads for select to authenticated
 using(exists(select 1 from public.company_memberships m where m.company_id=marketplace_loads.company_id and m.user_id=(select auth.uid())));
-- A separately authenticated backend endpoint will expose approved public listing fields only.
-- Do not expose marketplace_loads directly to external carriers.
