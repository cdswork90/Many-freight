-- MANY FREIGHT driver/customer contact history
-- Apply after migrations 001-004, adjusting company membership references if needed.
create table if not exists public.load_contact_logs (
 id uuid primary key default gen_random_uuid(),
 company_id uuid not null references public.companies(id) on delete cascade,
 load_id uuid references public.marketplace_loads(id) on delete set null,
 created_by uuid not null references auth.users(id),
 channel text not null check(channel in ('call','sms','email','in_app','other')),
 direction text not null check(direction in ('inbound','outbound')),
 contact_role text not null check(contact_role in ('driver','customer','dispatcher','carrier','other')),
 contact_name text,
 contact_address text,
 subject text,
 notes text,
 occurred_at timestamptz not null default now(),
 source text not null default 'manual' check(source in ('manual','in_app','authorized_integration')),
 external_reference text,
 created_at timestamptz not null default now()
);
create index if not exists load_contact_logs_company_load_time_idx on public.load_contact_logs(company_id,load_id,occurred_at desc);
alter table public.load_contact_logs enable row level security;
create policy load_contact_logs_tenant_read on public.load_contact_logs for select to authenticated using(
 exists(select 1 from public.company_memberships m where m.company_id=load_contact_logs.company_id and m.user_id=(select auth.uid()))
);
create policy load_contact_logs_tenant_insert on public.load_contact_logs for insert to authenticated with check(
 created_by=(select auth.uid()) and exists(select 1 from public.company_memberships m where m.company_id=load_contact_logs.company_id and m.user_id=(select auth.uid()))
 and (load_id is null or exists(select 1 from public.marketplace_loads l where l.id=load_contact_logs.load_id and l.company_id=load_contact_logs.company_id))
);
-- Append-only from the client. Corrections/deletion and retention should use audited privileged workflows.
-- Store attachments in private object storage with tenant-based access control.
-- Never capture device call/SMS/email content without supported integration and proper authorization.
