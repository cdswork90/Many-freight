-- Electronic agreement acceptance audit foundation (apply after company foundation).
create table if not exists public.platform_agreement_acceptances (
 id uuid primary key default gen_random_uuid(),
 company_id uuid not null references public.companies(id) on delete cascade,
 signer_user_id uuid not null references auth.users(id),
 signer_name text not null,
 signer_title text not null,
 signer_email text not null,
 agreement_version text not null,
 agreement_sha256 text not null,
 electronic_signature text not null,
 consented_to_electronic_records boolean not null check(consented_to_electronic_records),
 accepted_terms boolean not null check(accepted_terms),
 signed_at timestamptz not null default now(),
 audit_metadata jsonb not null default '{}'::jsonb
);
alter table public.platform_agreement_acceptances enable row level security;
create policy agreement_acceptance_read on public.platform_agreement_acceptances for select to authenticated using (
 exists(select 1 from public.company_memberships m where m.company_id=platform_agreement_acceptances.company_id and m.user_id=(select auth.uid()) and m.role in ('owner','admin'))
);
-- No browser INSERT/UPDATE/DELETE: only a verified server-side signing endpoint
-- may create immutable records after authenticating signer, verifying authority,
-- checking exact agreement hash and consent, and issuing a signed PDF copy.
