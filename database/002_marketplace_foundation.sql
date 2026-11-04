-- MANY FREIGHT marketplace foundation. Apply after database/001_foundation.sql.
-- Does not connect external load boards or phone systems.
create table if not exists public.marketplace_loads (
 id uuid primary key default gen_random_uuid(),
 company_id uuid not null references public.companies(id) on delete cascade,
 posted_by uuid not null references auth.users(id),
 title text not null check (length(trim(title)) between 3 and 160),
 origin text not null, destination text not null,
 equipment_type text not null default 'dry_van',
 pickup_date date, weight_lbs numeric(12,2) check (weight_lbs >= 0),
 description text, target_rate numeric(12,2) check (target_rate >= 0),
 contact_phone text,
 status text not null default 'draft' check(status in ('draft','open','awarded','cancelled','closed')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.marketplace_carrier_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 business_name text not null,
 dot_number text, mc_number text,
 verification_status text not null default 'pending' check (verification_status in ('pending','approved','rejected','suspended')),
 created_at timestamptz not null default now()
);
create table if not exists public.marketplace_bids (
 id uuid primary key default gen_random_uuid(),
 load_id uuid not null references public.marketplace_loads(id) on delete cascade,
 bidder_id uuid not null references auth.users(id) on delete cascade,
 amount numeric(12,2) not null check(amount > 0),
 note text,
 status text not null default 'submitted' check(status in ('submitted','withdrawn','accepted','declined')),
 created_at timestamptz not null default now(),
 unique(load_id,bidder_id)
);
create index if not exists marketplace_loads_status_idx on public.marketplace_loads(status,created_at desc);
create index if not exists marketplace_bids_load_idx on public.marketplace_bids(load_id);
alter table public.marketplace_loads enable row level security;
alter table public.marketplace_carrier_profiles enable row level security;
alter table public.marketplace_bids enable row level security;
-- Publicly visible load listings must exclude private contact fields. Use this safe view for discovery.
create or replace view public.marketplace_open_listings with (security_invoker=true) as
 select id,title,origin,destination,equipment_type,pickup_date,weight_lbs,description,target_rate,created_at
 from public.marketplace_loads where status='open';
create policy marketplace_loads_read on public.marketplace_loads for select to authenticated
 using (status='open' or exists(select 1 from public.company_memberships m where m.company_id=marketplace_loads.company_id and m.user_id=(select auth.uid())));
create policy marketplace_loads_insert on public.marketplace_loads for insert to authenticated
 with check(posted_by=(select auth.uid()) and exists(select 1 from public.company_memberships m where m.company_id=marketplace_loads.company_id and m.user_id=(select auth.uid()) and m.role in ('owner','admin','dispatcher')));
create policy marketplace_loads_update on public.marketplace_loads for update to authenticated
 using(exists(select 1 from public.company_memberships m where m.company_id=marketplace_loads.company_id and m.user_id=(select auth.uid()) and m.role in ('owner','admin','dispatcher')))
 with check(exists(select 1 from public.company_memberships m where m.company_id=marketplace_loads.company_id and m.user_id=(select auth.uid()) and m.role in ('owner','admin','dispatcher')));
create policy marketplace_carrier_self_read on public.marketplace_carrier_profiles for select to authenticated using(user_id=(select auth.uid()));
create policy marketplace_carrier_self_insert on public.marketplace_carrier_profiles for insert to authenticated with check(user_id=(select auth.uid()) and verification_status='pending');
create policy marketplace_carrier_self_update on public.marketplace_carrier_profiles for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()) and verification_status='pending');
create policy marketplace_bids_read on public.marketplace_bids for select to authenticated using(
 bidder_id=(select auth.uid()) or exists(select 1 from public.marketplace_loads l join public.company_memberships m on m.company_id=l.company_id where l.id=marketplace_bids.load_id and m.user_id=(select auth.uid()) and m.role in ('owner','admin','dispatcher')));
create policy marketplace_bids_insert on public.marketplace_bids for insert to authenticated with check(
 bidder_id=(select auth.uid()) and status='submitted'
 and exists(select 1 from public.marketplace_carrier_profiles p where p.user_id=(select auth.uid()) and p.verification_status='approved')
 and exists(select 1 from public.marketplace_loads l where l.id=marketplace_bids.load_id and l.status='open'));
-- SECURITY TODO: bid acceptance and carrier verification require privileged server-side RPCs.
-- Never let browser clients set verification_status='approved' or accept bids directly.
