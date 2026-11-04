-- MANY FREIGHT insurance compliance extension.
-- Apply after marketplace foundation migrations 002 and 003.
-- Configure exact legal certificate-holder name before accepting documents.
create table if not exists public.marketplace_carrier_insurance (
 id uuid primary key default gen_random_uuid(),
 carrier_user_id uuid not null references auth.users(id) on delete cascade,
 policy_type text not null check (policy_type in ('auto_liability','cargo','general_liability','other')),
 insurer_name text not null,
 policy_number text not null,
 effective_date date not null,
 expiration_date date not null,
 coverage_limit_usd numeric(14,2) check (coverage_limit_usd >= 0),
 certificate_holder_name text not null,
 storage_object_path text not null,
 verification_status text not null default 'pending' check (verification_status in ('pending','approved','rejected','expired')),
 verified_at timestamptz,
 verified_by uuid references auth.users(id),
 rejection_reason text,
 created_at timestamptz not null default now(),
 check(expiration_date >= effective_date)
);
create index if not exists marketplace_carrier_insurance_user_idx on public.marketplace_carrier_insurance(carrier_user_id,expiration_date);
alter table public.marketplace_carrier_insurance enable row level security;
create policy carrier_insurance_self_read on public.marketplace_carrier_insurance for select to authenticated
 using(carrier_user_id=(select auth.uid()));
create policy carrier_insurance_self_submit on public.marketplace_carrier_insurance for insert to authenticated
 with check(carrier_user_id=(select auth.uid()) and verification_status='pending' and verified_at is null and verified_by is null);
-- No direct client update/delete policy: review and changes must be server-side.
-- No client approval policy: privileged backend must verify directly with issuing agent/insurer.
-- Documents belong in a PRIVATE storage bucket; use signed URLs only for authorized reviewers.
-- Mandatory checks at bid submission and award time must run in trusted RPC/backend.
-- Merely writing the holder name is not proof of coverage or additional-insured status.
