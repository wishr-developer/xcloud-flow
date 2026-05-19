-- =====================================================================
-- XCloud-Flow v6: custom domains, invitations, recurring slots,
-- QR attendance, in-app notifications, locations.
-- Apply AFTER 0005. Fully idempotent.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ============== Custom domain ==============
alter table public.organizations add column if not exists custom_domain text;
create unique index if not exists organizations_custom_domain_idx
  on public.organizations(custom_domain) where custom_domain is not null;

-- ============== Invitations ==============
create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role text not null default 'staff' check (role in ('admin','staff','teacher','student','customer')),
  token text not null unique,
  status text not null default 'pending' check (status in ('pending','accepted','revoked','expired')),
  invited_by uuid references auth.users(id) on delete set null,
  accepted_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null default now() + interval '14 days',
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);
create index if not exists invitations_org_idx on public.invitations(organization_id);
create index if not exists invitations_token_idx on public.invitations(token);

alter table public.invitations enable row level security;
drop policy if exists "invitations_org_read" on public.invitations;
create policy "invitations_org_read" on public.invitations
  for select using (
    public.is_admin() or organization_id = public.current_org_id()
  );
drop policy if exists "invitations_org_write" on public.invitations;
create policy "invitations_org_write" on public.invitations
  for all using (
    public.is_admin() or organization_id = public.current_org_id()
  ) with check (
    public.is_admin() or organization_id = public.current_org_id()
  );
drop policy if exists "invitations_token_read" on public.invitations;
create policy "invitations_token_read" on public.invitations
  for select using (true);  -- token-based lookup (no enumeration since token is gen_random_uuid())

-- ============== Recurring rules ==============
create table if not exists public.recurring_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete cascade,
  teacher_id uuid references public.teachers(id) on delete set null,
  weekday int not null check (weekday between 0 and 6),  -- 0 = Sunday
  start_time time not null,
  end_time time not null,
  capacity int not null default 1,
  price int not null default 0,
  location text,
  online_url text,
  active boolean not null default true,
  weeks_ahead int not null default 4,
  created_at timestamptz not null default now()
);
create index if not exists recurring_rules_org_idx on public.recurring_rules(organization_id);

alter table public.recurring_rules enable row level security;
drop policy if exists "recurring_org_all" on public.recurring_rules;
create policy "recurring_org_all" on public.recurring_rules
  for all using (
    public.is_admin() or organization_id = public.current_org_id()
  ) with check (
    public.is_admin() or organization_id = public.current_org_id()
  );

-- ============== QR check-in on bookings ==============
alter table public.bookings add column if not exists qr_token text unique;
alter table public.bookings add column if not exists checked_in_at timestamptz;

-- Backfill tokens for existing bookings without one
update public.bookings set qr_token = gen_random_uuid()::text
  where qr_token is null;

create or replace function public.ensure_booking_qr_token()
returns trigger language plpgsql as $$
begin
  if new.qr_token is null then
    new.qr_token = gen_random_uuid()::text;
  end if;
  return new;
end$$;

drop trigger if exists trg_bookings_qr_token on public.bookings;
create trigger trg_bookings_qr_token
  before insert on public.bookings
  for each row execute function public.ensure_booking_qr_token();

-- ============== In-app notifications ==============
create table if not exists public.in_app_notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  type text not null default 'info',
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists in_app_notif_user_idx
  on public.in_app_notifications(user_id, created_at desc);

alter table public.in_app_notifications enable row level security;
drop policy if exists "notif_user_read" on public.in_app_notifications;
create policy "notif_user_read" on public.in_app_notifications
  for select using (
    public.is_admin()
    or user_id = auth.uid()
    or organization_id = public.current_org_id()
  );
drop policy if exists "notif_self_update" on public.in_app_notifications;
create policy "notif_self_update" on public.in_app_notifications
  for update using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());
drop policy if exists "notif_org_insert" on public.in_app_notifications;
create policy "notif_org_insert" on public.in_app_notifications
  for insert with check (true);

-- ============== Locations (multi-location / franchise) ==============
create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  address text,
  phone text,
  email text,
  timezone text,
  online boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists locations_org_idx on public.locations(organization_id);

alter table public.locations enable row level security;
drop policy if exists "locations_read" on public.locations;
create policy "locations_read" on public.locations
  for select using (
    public.is_admin() or organization_id = public.current_org_id() or true
  );
drop policy if exists "locations_admin_write" on public.locations;
create policy "locations_admin_write" on public.locations
  for all using (
    public.is_admin() or organization_id = public.current_org_id()
  ) with check (
    public.is_admin() or organization_id = public.current_org_id()
  );

-- Booking slots → location_id (optional)
alter table public.booking_slots add column if not exists location_id uuid
  references public.locations(id) on delete set null;

-- Organizations → franchise / multi-location flag
alter table public.organizations add column if not exists multi_location boolean not null default false;
