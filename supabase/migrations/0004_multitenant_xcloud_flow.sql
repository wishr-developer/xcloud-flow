-- =====================================================================
-- XCloud-Flow v4: Multi-tenant SaaS (organizations)
-- Apply AFTER 0001 / 0002 / 0003.
-- Fully idempotent — safe to re-run.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ============== Organizations ==============
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  business_type text not null default 'multi' check (business_type in (
    'multi','learning','sports','cooking','music','language','dance','yoga','fitness','art','business','other'
  )),
  plan text not null default 'free' check (plan in ('free','starter','pro','enterprise')),
  status text not null default 'active' check (status in ('active','suspended','closed')),
  owner_id uuid references auth.users(id) on delete set null,
  primary_color text not null default '#4F46E5',
  timezone text not null default 'Asia/Tokyo',
  currency text not null default 'JPY',
  locale text not null default 'ja',
  hero_copy text,
  chat_opening_message text,
  service_label text,
  instructor_label text,
  participant_label text,
  schedule_label text,
  sample_categories text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists organizations_owner_idx on public.organizations(owner_id);

-- ============== Subscriptions ==============
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text not null default 'free' check (plan in ('free','starter','pro','enterprise')),
  status text not null default 'active',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_org_idx on public.subscriptions(organization_id);

-- ============== Add organization_id to existing tables (idempotent) ==============
do $$
declare
  t text;
  tables text[] := array[
    'profiles',
    'site_config',
    'courses',
    'course_modules',
    'course_lessons',
    'lessons',
    'teachers',
    'booking_slots',
    'bookings',
    'customers',
    'enrollments',
    'lesson_progress',
    'certificates',
    'course_reviews',
    'payments',
    'notification_logs',
    'coupons',
    'faqs',
    'announcements',
    'contacts',
    'app_settings'
  ];
begin
  foreach t in array tables
  loop
    if exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = t
    ) then
      execute format(
        'alter table public.%I add column if not exists organization_id uuid references public.organizations(id) on delete set null',
        t
      );
      execute format(
        'create index if not exists %I on public.%I(organization_id)',
        t || '_org_idx', t
      );
    end if;
  end loop;
end$$;

-- ============== Payments / Subscriptions linkage on payments ==============
alter table public.payments add column if not exists subscription_id uuid references public.subscriptions(id) on delete set null;
alter table public.payments add column if not exists provider_customer_id text;

-- Loosen the payments.provider check so subscription / free providers work
do $$
begin
  if exists (
    select 1 from pg_constraint where conname = 'payments_provider_check'
  ) then
    alter table public.payments drop constraint payments_provider_check;
  end if;
end$$;
alter table public.payments
  add constraint payments_provider_check
  check (provider in ('stripe','onsite','demo','free','subscription'));

-- ============== Helpers ==============
create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from public.profiles where id = auth.uid();
$$;

create or replace function public.touch_org_updated()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists trg_organizations_updated on public.organizations;
create trigger trg_organizations_updated
  before update on public.organizations
  for each row execute function public.touch_org_updated();

drop trigger if exists trg_subscriptions_updated on public.subscriptions;
create trigger trg_subscriptions_updated
  before update on public.subscriptions
  for each row execute function public.touch_org_updated();

-- ============== Auto-organization on signup ==============
create or replace function public.handle_new_user_org()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org uuid;
  existing_org uuid;
  existing_count int;
begin
  -- If a profile already exists with org, do nothing
  select organization_id into existing_org
    from public.profiles where id = new.id;
  if existing_org is not null then
    return new;
  end if;

  insert into public.organizations (name, slug, business_type, plan, owner_id)
  values (
    coalesce(split_part(new.email,'@',1) || ' のスクール', '新しいスクール'),
    coalesce(replace(replace(lower(coalesce(new.email,'org-' || new.id::text)), '@','-'), '.','-'), 'org-' || new.id::text),
    'multi',
    'free',
    new.id
  )
  returning id into new_org;

  -- Make the first global user an admin; otherwise customer
  select count(*) into existing_count from public.profiles;

  insert into public.profiles (id, email, display_name, role, organization_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)),
    case when existing_count = 0 then 'admin' else 'admin' end,
    new_org
  )
  on conflict (id) do update set organization_id = excluded.organization_id;

  insert into public.subscriptions (organization_id, plan, status)
  values (new_org, 'free', 'active');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user_org();

-- ============== Backfill: assign existing data to a default org ==============
do $$
declare
  default_org_id uuid;
  any_owner uuid;
begin
  -- Pick the first profile id that has admin/staff role, if any
  select id into any_owner from public.profiles
    where role in ('admin','staff')
    order by created_at asc limit 1;

  -- Reuse an existing org, or create the default
  select id into default_org_id from public.organizations
    where slug = 'default' limit 1;

  if default_org_id is null then
    insert into public.organizations (name, slug, business_type, plan, owner_id)
    values ('Default Organization', 'default', 'multi', 'free', any_owner)
    returning id into default_org_id;
  end if;

  -- Backfill profiles
  update public.profiles set organization_id = default_org_id where organization_id is null;
  -- Backfill all tables that now have organization_id
  update public.courses set organization_id = default_org_id where organization_id is null;
  update public.course_modules set organization_id = default_org_id where organization_id is null;
  update public.course_lessons set organization_id = default_org_id where organization_id is null;
  update public.lessons set organization_id = default_org_id where organization_id is null;
  update public.teachers set organization_id = default_org_id where organization_id is null;
  update public.booking_slots set organization_id = default_org_id where organization_id is null;
  update public.bookings set organization_id = default_org_id where organization_id is null;
  update public.customers set organization_id = default_org_id where organization_id is null;
  update public.enrollments set organization_id = default_org_id where organization_id is null;
  update public.notification_logs set organization_id = default_org_id where organization_id is null;
  update public.payments set organization_id = default_org_id where organization_id is null;
  update public.coupons set organization_id = default_org_id where organization_id is null;
  update public.faqs set organization_id = default_org_id where organization_id is null;
  update public.announcements set organization_id = default_org_id where organization_id is null;
  update public.contacts set organization_id = default_org_id where organization_id is null;
  update public.app_settings set organization_id = default_org_id where organization_id is null;
  -- ensure a default subscription
  insert into public.subscriptions (organization_id, plan, status)
    select default_org_id, 'free', 'active'
    where not exists (select 1 from public.subscriptions where organization_id = default_org_id);
exception when others then
  -- never let backfill block the migration
  null;
end$$;

-- ============== RLS — keep light to avoid breaking MVP, but no public dumping of org data ==============
alter table public.organizations enable row level security;
alter table public.subscriptions enable row level security;

drop policy if exists "org_member_read" on public.organizations;
create policy "org_member_read" on public.organizations
  for select using (
    public.is_admin()
    or id = public.current_org_id()
    or owner_id = auth.uid()
  );

drop policy if exists "org_owner_write" on public.organizations;
create policy "org_owner_write" on public.organizations
  for update using (
    public.is_admin() or owner_id = auth.uid()
  ) with check (
    public.is_admin() or owner_id = auth.uid()
  );

drop policy if exists "org_self_insert" on public.organizations;
create policy "org_self_insert" on public.organizations
  for insert with check (true);

drop policy if exists "subs_org_read" on public.subscriptions;
create policy "subs_org_read" on public.subscriptions
  for select using (
    public.is_admin() or organization_id = public.current_org_id()
  );

drop policy if exists "subs_admin_write" on public.subscriptions;
create policy "subs_admin_write" on public.subscriptions
  for all using (public.is_admin())
  with check (public.is_admin());

-- ============== Demo seed for default org ==============
-- (Non-destructive — only inserts placeholder if empty.)
do $$
begin
  insert into public.faqs (category, question, answer, order_index, published)
  select 'プラン', '無料プランで何ができますか？', '月10件までの予約管理、業種テンプレート切り替え、基本予約ページがご利用いただけます。', 100, true
  where not exists (select 1 from public.faqs where question = '無料プランで何ができますか？');
exception when others then null;
end$$;
