-- =====================================================================
-- XCloud-Flow v5: audit_logs + organization branding fields
-- Apply AFTER 0004. Fully idempotent.
-- =====================================================================

-- Organization branding fields (logo, hero, contact)
alter table public.organizations add column if not exists logo_url text;
alter table public.organizations add column if not exists tagline text;
alter table public.organizations add column if not exists website text;
alter table public.organizations add column if not exists contact_email text;
alter table public.organizations add column if not exists phone text;
alter table public.organizations add column if not exists onboarding_completed boolean not null default false;

-- ============== audit_logs ==============
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  actor_email text,
  category text not null,        -- e.g. organization | admin | booking | course | subscription
  action text not null,          -- e.g. create | update | delete | upgrade
  target_type text,              -- table name
  target_id text,
  meta jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_logs_org_idx on public.audit_logs(organization_id);
create index if not exists audit_logs_created_idx on public.audit_logs(created_at desc);

alter table public.audit_logs enable row level security;

drop policy if exists "audit_org_read" on public.audit_logs;
create policy "audit_org_read" on public.audit_logs
  for select using (
    public.is_admin() or organization_id = public.current_org_id()
  );

drop policy if exists "audit_org_insert" on public.audit_logs;
create policy "audit_org_insert" on public.audit_logs
  for insert with check (true);

-- ============== helpful view ==============
create or replace view public.org_kpis as
select
  o.id as organization_id,
  (select count(*) from public.bookings b
     where b.organization_id = o.id
       and b.created_at >= date_trunc('month', now())) as bookings_month,
  (select coalesce(sum(b.total_price), 0) from public.bookings b
     where b.organization_id = o.id
       and b.payment_status in ('paid','demo_paid')
       and b.created_at >= date_trunc('month', now())) as revenue_month,
  (select count(*) from public.customers c
     where c.organization_id = o.id) as customers_total
from public.organizations o;
