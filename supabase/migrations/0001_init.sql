-- BS Booking SaaS schema
-- Run this in Supabase SQL editor.

-- ============== Extensions ==============
create extension if not exists "pgcrypto";

-- ============== Tables ==============
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  role text not null default 'customer' check (role in ('admin','staff','customer')),
  line_user_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  bio text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  duration_minutes int not null default 60,
  price int not null default 0,
  capacity int not null default 1,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.booking_slots (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  teacher_id uuid references public.teachers(id) on delete set null,
  date date not null,
  start_time time not null,
  end_time time not null,
  capacity int not null default 1,
  booked_count int not null default 0,
  price int not null default 0,
  status text not null default 'open' check (status in ('open','closed','full')),
  created_at timestamptz not null default now()
);
create index if not exists booking_slots_date_idx on public.booking_slots(date);
create index if not exists booking_slots_lesson_idx on public.booking_slots(lesson_id);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  slot_id uuid not null references public.booking_slots(id) on delete cascade,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  payment_method text not null default 'onsite' check (payment_method in ('onsite','stripe','demo')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','pending','paid','demo_paid')),
  attendance_status text not null default 'enrolled' check (attendance_status in ('enrolled','attended','absent','canceled')),
  status text not null default 'confirmed' check (status in ('confirmed','canceled')),
  total_price int not null default 0,
  memo text,
  created_at timestamptz not null default now()
);
create index if not exists bookings_slot_idx on public.bookings(slot_id);
create index if not exists bookings_user_idx on public.bookings(user_id);
create index if not exists bookings_email_idx on public.bookings(customer_email);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text not null,
  phone text,
  tags text[] default '{}',
  memo text,
  total_bookings int not null default 0,
  total_spent int not null default 0,
  last_booking_at timestamptz,
  created_at timestamptz not null default now(),
  unique(email)
);

create table if not exists public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete set null,
  type text not null check (type in ('line','email','system')),
  status text not null check (status in ('success','skipped','failed')),
  message text,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  amount int not null default 0,
  provider text not null check (provider in ('stripe','onsite','demo')),
  status text not null,
  checkout_session_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  key text primary key,
  value text
);

-- ============== Triggers ==============
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)), 'customer')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper to check admin role
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role in ('admin','staff') from public.profiles where id = auth.uid()),
    false
  );
$$;

-- ============== Row Level Security ==============
alter table public.profiles enable row level security;
alter table public.teachers enable row level security;
alter table public.lessons enable row level security;
alter table public.booking_slots enable row level security;
alter table public.bookings enable row level security;
alter table public.customers enable row level security;
alter table public.notification_logs enable row level security;
alter table public.payments enable row level security;
alter table public.app_settings enable row level security;

-- profiles
drop policy if exists "profiles_self_read" on public.profiles;
create policy "profiles_self_read" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update" on public.profiles
  for update using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_admin_insert" on public.profiles;
create policy "profiles_admin_insert" on public.profiles
  for insert with check (auth.uid() = id or public.is_admin());

-- lessons (public readable, admin writable)
drop policy if exists "lessons_read_all" on public.lessons;
create policy "lessons_read_all" on public.lessons for select using (true);
drop policy if exists "lessons_admin_write" on public.lessons;
create policy "lessons_admin_write" on public.lessons
  for all using (public.is_admin()) with check (public.is_admin());

-- teachers
drop policy if exists "teachers_read_all" on public.teachers;
create policy "teachers_read_all" on public.teachers for select using (true);
drop policy if exists "teachers_admin_write" on public.teachers;
create policy "teachers_admin_write" on public.teachers
  for all using (public.is_admin()) with check (public.is_admin());

-- slots
drop policy if exists "slots_read_all" on public.booking_slots;
create policy "slots_read_all" on public.booking_slots for select using (true);
drop policy if exists "slots_admin_write" on public.booking_slots;
create policy "slots_admin_write" on public.booking_slots
  for all using (public.is_admin()) with check (public.is_admin());

-- bookings
drop policy if exists "bookings_user_read" on public.bookings;
create policy "bookings_user_read" on public.bookings
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "bookings_user_insert" on public.bookings;
create policy "bookings_user_insert" on public.bookings
  for insert with check (user_id = auth.uid() or user_id is null or public.is_admin());

drop policy if exists "bookings_user_update" on public.bookings;
create policy "bookings_user_update" on public.bookings
  for update using (user_id = auth.uid() or public.is_admin());

drop policy if exists "bookings_admin_delete" on public.bookings;
create policy "bookings_admin_delete" on public.bookings
  for delete using (public.is_admin());

-- customers (admin only)
drop policy if exists "customers_admin_all" on public.customers;
create policy "customers_admin_all" on public.customers
  for all using (public.is_admin()) with check (public.is_admin());

-- notification_logs (admin only)
drop policy if exists "notif_admin_all" on public.notification_logs;
create policy "notif_admin_all" on public.notification_logs
  for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "notif_insert_any" on public.notification_logs;
create policy "notif_insert_any" on public.notification_logs
  for insert with check (true);

-- payments (admin only)
drop policy if exists "payments_admin_all" on public.payments;
create policy "payments_admin_all" on public.payments
  for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "payments_user_read" on public.payments;
create policy "payments_user_read" on public.payments
  for select using (
    public.is_admin() or exists (
      select 1 from public.bookings b where b.id = booking_id and b.user_id = auth.uid()
    )
  );

-- app_settings (admin only)
drop policy if exists "settings_admin_all" on public.app_settings;
create policy "settings_admin_all" on public.app_settings
  for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "settings_read_all" on public.app_settings;
create policy "settings_read_all" on public.app_settings for select using (true);

-- ============== Seed data ==============
insert into public.app_settings(key,value) values
  ('line_webhook_url', null),
  ('stripe_price_id', null)
on conflict (key) do nothing;

insert into public.teachers (name, email, bio, active) values
  ('佐藤 健', 'sato@example.com', 'ヨガ・ピラティス担当。経験10年。', true),
  ('鈴木 美咲', 'suzuki@example.com', '整体・リラクゼーションを担当。', true)
on conflict do nothing;

insert into public.lessons (title, description, duration_minutes, price, capacity, active) values
  ('ヨガ体験レッスン', '初心者向けの60分体験クラス', 60, 3000, 6, true),
  ('整体コース60分', '肩こり・腰痛にお悩みの方向け', 60, 6000, 1, true),
  ('オンライン英会話', 'ビジネス向けマンツーマンレッスン', 50, 4500, 1, true)
on conflict do nothing;
