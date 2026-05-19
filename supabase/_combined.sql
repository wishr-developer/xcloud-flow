-- =====================================================================
-- XCloud-Flow — ALL-IN-ONE SQL (0001 + 0002 + 0003)
-- Paste into Supabase Dashboard > SQL Editor > Run
-- =====================================================================

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

-- ===== 0002_xcloud_flow.sql =====

-- XCloud Flow v2: e-learning courses + marketing
-- Apply after 0001_init.sql.

create extension if not exists "pgcrypto";

-- ============== Courses (on-demand e-learning) ==============
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  subtitle text,
  description text,
  thumbnail_url text,
  category text,
  level text not null default 'beginner' check (level in ('beginner','intermediate','advanced')),
  price int not null default 0,
  sale_price int,
  duration_minutes int not null default 0,
  lesson_count int not null default 0,
  instructor_id uuid references public.teachers(id) on delete set null,
  published boolean not null default true,
  featured boolean not null default false,
  rating_avg numeric(3,2) not null default 0,
  rating_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists courses_published_idx on public.courses(published);
create index if not exists courses_category_idx on public.courses(category);

create table if not exists public.course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists course_modules_course_idx on public.course_modules(course_id);

create table if not exists public.course_lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.course_modules(id) on delete cascade,
  title text not null,
  description text,
  video_url text,
  content text,
  duration_seconds int not null default 0,
  order_index int not null default 0,
  preview boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists course_lessons_module_idx on public.course_lessons(module_id);

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  course_id uuid not null references public.courses(id) on delete cascade,
  customer_name text not null,
  customer_email text not null,
  payment_method text not null default 'onsite' check (payment_method in ('onsite','stripe','demo','free')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','pending','paid','demo_paid','free')),
  amount_paid int not null default 0,
  status text not null default 'active' check (status in ('active','completed','canceled')),
  progress_percent int not null default 0,
  last_accessed_at timestamptz,
  enrolled_at timestamptz not null default now(),
  completed_at timestamptz,
  coupon_code text,
  unique (user_id, course_id),
  unique (customer_email, course_id)
);
create index if not exists enrollments_course_idx on public.enrollments(course_id);
create index if not exists enrollments_user_idx on public.enrollments(user_id);

create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  lesson_id uuid not null references public.course_lessons(id) on delete cascade,
  completed boolean not null default false,
  watched_seconds int not null default 0,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (enrollment_id, lesson_id)
);

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null unique references public.enrollments(id) on delete cascade,
  certificate_number text unique not null,
  issued_at timestamptz not null default now()
);

create table if not exists public.course_reviews (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);
create index if not exists course_reviews_course_idx on public.course_reviews(course_id);

-- ============== Marketing / Support ==============
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  pinned boolean not null default false,
  published boolean not null default true,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  category text,
  question text not null,
  answer text not null,
  order_index int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  description text,
  discount_type text not null check (discount_type in ('percent','fixed')),
  discount_value int not null default 0,
  max_uses int,
  used_count int not null default 0,
  expires_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  subject text,
  message text not null,
  status text not null default 'new' check (status in ('new','responded','closed')),
  created_at timestamptz not null default now()
);

-- ============== Triggers ==============
create or replace function public.touch_courses_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end$$;

drop trigger if exists trg_courses_updated on public.courses;
create trigger trg_courses_updated before update on public.courses
for each row execute function public.touch_courses_updated_at();

-- Refresh course lesson_count and duration after lesson change
create or replace function public.refresh_course_aggregates(p_course uuid)
returns void language sql as $$
  update public.courses c
  set lesson_count = coalesce((
        select count(*) from public.course_lessons l
        join public.course_modules m on m.id = l.module_id
        where m.course_id = c.id
      ), 0),
      duration_minutes = coalesce((
        select round(sum(l.duration_seconds)/60.0)::int from public.course_lessons l
        join public.course_modules m on m.id = l.module_id
        where m.course_id = c.id
      ), 0)
  where c.id = p_course;
$$;

-- ============== RLS ==============
alter table public.courses enable row level security;
alter table public.course_modules enable row level security;
alter table public.course_lessons enable row level security;
alter table public.enrollments enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.certificates enable row level security;
alter table public.course_reviews enable row level security;
alter table public.announcements enable row level security;
alter table public.faqs enable row level security;
alter table public.coupons enable row level security;
alter table public.contacts enable row level security;

-- courses + modules + lessons readable by all, admin writable
drop policy if exists "courses_read_all" on public.courses;
create policy "courses_read_all" on public.courses for select using (true);
drop policy if exists "courses_admin_write" on public.courses;
create policy "courses_admin_write" on public.courses
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "modules_read_all" on public.course_modules;
create policy "modules_read_all" on public.course_modules for select using (true);
drop policy if exists "modules_admin_write" on public.course_modules;
create policy "modules_admin_write" on public.course_modules
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "lessons_read_all" on public.course_lessons;
create policy "lessons_read_all" on public.course_lessons for select using (true);
drop policy if exists "lessons_admin_write" on public.course_lessons;
create policy "lessons_admin_write" on public.course_lessons
  for all using (public.is_admin()) with check (public.is_admin());

-- enrollments: own + admin
drop policy if exists "enr_user_read" on public.enrollments;
create policy "enr_user_read" on public.enrollments
  for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "enr_user_insert" on public.enrollments;
create policy "enr_user_insert" on public.enrollments
  for insert with check (user_id = auth.uid() or user_id is null or public.is_admin());
drop policy if exists "enr_user_update" on public.enrollments;
create policy "enr_user_update" on public.enrollments
  for update using (user_id = auth.uid() or public.is_admin());

drop policy if exists "progress_user_all" on public.lesson_progress;
create policy "progress_user_all" on public.lesson_progress
  for all using (
    public.is_admin() or exists (
      select 1 from public.enrollments e where e.id = enrollment_id and e.user_id = auth.uid()
    )
  ) with check (
    public.is_admin() or exists (
      select 1 from public.enrollments e where e.id = enrollment_id and (e.user_id = auth.uid() or e.user_id is null)
    )
  );

drop policy if exists "cert_user_read" on public.certificates;
create policy "cert_user_read" on public.certificates
  for select using (
    public.is_admin() or exists (
      select 1 from public.enrollments e where e.id = enrollment_id and e.user_id = auth.uid()
    )
  );
drop policy if exists "cert_admin_write" on public.certificates;
create policy "cert_admin_write" on public.certificates
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "reviews_read_all" on public.course_reviews;
create policy "reviews_read_all" on public.course_reviews for select using (true);
drop policy if exists "reviews_user_insert" on public.course_reviews;
create policy "reviews_user_insert" on public.course_reviews for insert with check (true);
drop policy if exists "reviews_admin_write" on public.course_reviews;
create policy "reviews_admin_write" on public.course_reviews
  for update using (public.is_admin());
drop policy if exists "reviews_admin_delete" on public.course_reviews;
create policy "reviews_admin_delete" on public.course_reviews
  for delete using (public.is_admin());

-- announcements / faqs: public read, admin write
drop policy if exists "ann_read_all" on public.announcements;
create policy "ann_read_all" on public.announcements for select using (true);
drop policy if exists "ann_admin_write" on public.announcements;
create policy "ann_admin_write" on public.announcements
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "faqs_read_all" on public.faqs;
create policy "faqs_read_all" on public.faqs for select using (true);
drop policy if exists "faqs_admin_write" on public.faqs;
create policy "faqs_admin_write" on public.faqs
  for all using (public.is_admin()) with check (public.is_admin());

-- coupons: admin only (read for validation handled server-side)
drop policy if exists "coupons_admin_all" on public.coupons;
create policy "coupons_admin_all" on public.coupons
  for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "coupons_read_active" on public.coupons;
create policy "coupons_read_active" on public.coupons
  for select using (active = true);

-- contacts: admin only read, public insert
drop policy if exists "contacts_admin_read" on public.contacts;
create policy "contacts_admin_read" on public.contacts
  for select using (public.is_admin());
drop policy if exists "contacts_admin_update" on public.contacts;
create policy "contacts_admin_update" on public.contacts
  for update using (public.is_admin());
drop policy if exists "contacts_admin_delete" on public.contacts;
create policy "contacts_admin_delete" on public.contacts
  for delete using (public.is_admin());
drop policy if exists "contacts_public_insert" on public.contacts;
create policy "contacts_public_insert" on public.contacts
  for insert with check (true);

-- ============== Seed data ==============
insert into public.courses (slug, title, subtitle, description, category, level, price, sale_price, featured, published) values
  ('intro-to-cloud', 'クラウド入門', 'AWS/GCP/Azureを横断する基礎講座', 'クラウドコンピューティングの基本概念から、主要3社のサービスの違い、ハンズオンまでを体系的に学べます。', 'クラウド', 'beginner', 19800, 9800, true, true),
  ('react-fundamentals', 'React 実践入門', 'モダンフロントエンドを基礎から', 'React Hooks、状態管理、Next.js連携、テストまでをハンズオン中心で習得します。', 'プログラミング', 'beginner', 24800, null, true, true),
  ('cybersecurity-basics', 'サイバーセキュリティの基礎', '組織で必須の知識を1時間で', '脅威モデル、認証、暗号、運用までを実例ベースで解説します。', 'セキュリティ', 'beginner', 14800, null, false, true),
  ('data-analytics-pro', 'データ分析プロフェッショナル', 'SQL〜可視化〜統計までを実務目線で', '実データを使った課題を通じ、即戦力レベルの分析スキルを習得します。', 'データ', 'intermediate', 39800, 29800, true, true)
on conflict (slug) do nothing;

-- Seed modules + lessons for the first course only (others are listed/purchasable but empty)
do $$
declare c_id uuid; m1 uuid; m2 uuid;
begin
  select id into c_id from public.courses where slug = 'intro-to-cloud';
  if c_id is not null then
    insert into public.course_modules (course_id, title, order_index)
      values (c_id, 'Section 1. クラウドとは', 0)
      returning id into m1;
    insert into public.course_modules (course_id, title, order_index)
      values (c_id, 'Section 2. AWS / GCP / Azure 比較', 1)
      returning id into m2;

    insert into public.course_lessons (module_id, title, description, duration_seconds, order_index, preview, content) values
      (m1, 'クラウドの定義とメリット', 'IaaS / PaaS / SaaS の整理', 480, 0, true,
       E'# クラウドの定義\nクラウドとは、インターネット経由でITリソースをオンデマンドに利用できるモデルです。\n\n## 3つのレイヤー\n- IaaS: 仮想マシン・ストレージ\n- PaaS: 実行基盤\n- SaaS: 完成アプリケーション'),
      (m1, '主要なサービス分類', 'コンピュート / ストレージ / DB / ネットワーク', 540, 1, false,
       E'# サービス分類\nコンピュート、ストレージ、データベース、ネットワークの4つが基本軸です。'),
      (m2, 'AWS の特徴', '最も成熟したクラウドベンダー', 600, 0, false,
       E'# AWS\nもっとも豊富なサービス群を誇り、エンタープライズシェアで首位。'),
      (m2, 'GCP / Azure の特徴', 'データ分析と企業統合', 660, 1, false,
       E'# GCP / Azure\nGoogle Cloud はデータ・ML分野、Microsoft Azure は企業統合に強み。');

    perform public.refresh_course_aggregates(c_id);
  end if;
end$$;

insert into public.announcements (title, body, pinned, published) values
  ('XCloud Flow 正式ローンチ', 'オンデマンド講座と予約・決済を統合したラーニングプラットフォーム XCloud Flow をリリースしました。受講と予約の両方が1つのアカウントで管理できます。', true, true),
  ('新講座: クラウド入門 が公開', 'AWS / GCP / Azure を横断するクラウド入門講座を公開しました。期間限定で半額キャンペーン中です。', false, true)
on conflict do nothing;

insert into public.faqs (category, question, answer, order_index) values
  ('受講について', '講座はいつでも受講できますか？', 'はい。購入後すぐに視聴可能で、受講期限はありません。', 0),
  ('受講について', '修了証は発行されますか？', '全レッスンを完了すると、マイページから修了証 (PDF相当) を発行できます。', 1),
  ('決済について', '支払い方法は何が使えますか？', 'クレジットカード (Stripe) と現地支払いをご用意しています。デモ環境ではテスト決済も可能です。', 2),
  ('予約について', '当日キャンセルは可能ですか？', '予約状況により可否が異なります。マイページからキャンセル可能、もしくは事務局までご連絡ください。', 3)
on conflict do nothing;

insert into public.coupons (code, description, discount_type, discount_value, max_uses, active) values
  ('WELCOME20', '初回20% OFFクーポン', 'percent', 20, 1000, true),
  ('OPEN3000', 'オープン記念 3,000円OFF', 'fixed', 3000, 500, true)
on conflict (code) do nothing;

-- ===== 0003_multi_industry.sql =====

-- =====================================================================
-- XCloud-Flow v3: Multi-industry support
-- Apply AFTER 0001_init.sql + 0002_xcloud_flow.sql.
-- Idempotent.
-- =====================================================================

-- ============== Site Config (singleton) ==============
create table if not exists public.site_config (
  id int primary key default 1 check (id = 1),
  product_name text not null default 'XCloud-Flow',
  business_type text not null default 'multi' check (business_type in (
    'multi','learning','sports','cooking','music','language','dance','yoga','fitness','art','business','other'
  )),
  service_label text not null default 'レッスン',
  instructor_label text not null default '講師',
  participant_label text not null default '受講者',
  schedule_label text not null default '予約枠',
  primary_color text not null default '#4F46E5',
  timezone text not null default 'Asia/Tokyo',
  currency text not null default 'JPY',
  locale text not null default 'ja',
  updated_at timestamptz not null default now()
);

insert into public.site_config (id) values (1)
on conflict (id) do nothing;

create or replace function public.touch_site_config_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists trg_site_config_updated on public.site_config;
create trigger trg_site_config_updated
  before update on public.site_config
  for each row execute function public.touch_site_config_updated_at();

alter table public.site_config enable row level security;
drop policy if exists "site_config_read_all" on public.site_config;
create policy "site_config_read_all" on public.site_config for select using (true);
drop policy if exists "site_config_admin_write" on public.site_config;
create policy "site_config_admin_write" on public.site_config
  for update using (public.is_admin()) with check (public.is_admin());

-- ============== Generic fields ==============

-- lessons (booking-style menu items)
alter table public.lessons add column if not exists category text;
alter table public.lessons add column if not exists difficulty text
  check (difficulty in ('beginner','intermediate','advanced') or difficulty is null);
alter table public.lessons add column if not exists location_type text not null default 'offline'
  check (location_type in ('offline','online','hybrid'));
alter table public.lessons add column if not exists target_audience text;
alter table public.lessons add column if not exists required_items text;

-- courses (e-learning) — many fields already exist; add the missing ones
alter table public.courses add column if not exists difficulty text;
update public.courses set difficulty = level where difficulty is null;
alter table public.courses add column if not exists location_type text not null default 'online'
  check (location_type in ('offline','online','hybrid'));
alter table public.courses add column if not exists target_audience text;
alter table public.courses add column if not exists required_items text;
alter table public.courses add column if not exists active boolean not null default true;

-- booking_slots
alter table public.booking_slots add column if not exists location text;
alter table public.booking_slots add column if not exists online_url text;
alter table public.booking_slots add column if not exists waitlist_enabled boolean not null default false;
alter table public.booking_slots add column if not exists waitlist_count int not null default 0;

-- bookings
alter table public.bookings add column if not exists participant_note text;
alter table public.bookings add column if not exists admin_note text;
alter table public.bookings add column if not exists source text not null default 'web'
  check (source in ('web','chat','admin','api'));
alter table public.bookings add column if not exists reminder_sent_at timestamptz;

-- ============== Industry tag for courses (optional, for filtering) ==============
alter table public.courses add column if not exists industry text;
-- Backfill: derive from category where possible
update public.courses set industry = case
  when category in ('プログラミング','クラウド','データ','セキュリティ','ビジネス','語学','学習') then category
  when category is null then null
  else category
end where industry is null;

-- ============== Updated seed: industry-diverse demo data ==============
do $$
declare
  teacher_id_yoga uuid;
  teacher_id_chef uuid;
  teacher_id_music uuid;
begin
  -- Add industry instructors if absent (idempotent on name)
  insert into public.teachers (name, email, bio, active) values
    ('山田 真理', 'yoga@example.com', 'ヨガ・ピラティス歴12年。RYT500保持。', true)
    on conflict do nothing;
  insert into public.teachers (name, email, bio, active) values
    ('シェフ 大谷', 'chef@example.com', 'フレンチ料理シェフ。料理教室講師歴8年。', true)
    on conflict do nothing;
  insert into public.teachers (name, email, bio, active) values
    ('田中 涼介', 'music@example.com', 'ジャズピアニスト。音楽スクール主宰。', true)
    on conflict do nothing;

  -- Add lessons across industries (idempotent on title)
  insert into public.lessons (title, description, duration_minutes, price, capacity, active, category, difficulty, location_type, target_audience, required_items) values
    ('朝ヨガ・リフレッシュクラス', '60分の初心者向けクラス。柔軟性と呼吸を整えます。', 60, 2800, 8, true, 'ヨガ', 'beginner', 'offline', '初心者・女性に人気', 'ヨガマット (貸出可)'),
    ('家庭で作るフレンチ入門', '前菜・メイン・デザートを2.5時間で。', 150, 7800, 6, true, '料理', 'beginner', 'offline', '料理初心者〜中級者', 'エプロン (各自)'),
    ('ジャズピアノ・トライアル', '楽器経験ゼロでもコードの仕組みを学べる90分。', 90, 5500, 1, true, '音楽', 'beginner', 'hybrid', '大人の音楽初学者', 'ノート・筆記用具'),
    ('体験 1on1パーソナルトレーニング', '個別カウンセリング + 60分セッション。', 60, 6500, 1, true, 'フィットネス', 'beginner', 'offline', '運動初心者〜', '動きやすい服装'),
    ('英会話・ビジネス英語50分', 'ネイティブ講師のオンラインレッスン。', 50, 4200, 1, true, '語学', 'intermediate', 'online', '社会人・ビジネス層', 'ヘッドセット推奨')
    on conflict do nothing;

  -- Add e-learning courses across industries
  insert into public.courses (slug, title, subtitle, description, category, industry, level, difficulty, location_type, price, sale_price, featured, published) values
    ('yoga-anatomy', 'ヨガ解剖学の基礎', 'ポーズを安全に深めるための体の理解', 'アライメント、関節の可動域、呼吸メカニクスをイラスト付きで学ぶオンライン講座です。', 'ヨガ', 'ヨガ', 'beginner', 'beginner', 'online', 12800, 9800, true, true),
    ('home-cooking-french', 'おうちフレンチ・基礎12レシピ', 'シェフが教える家庭再現レシピ', '食材選び、火入れ、ソース作りまで、シェフが家庭目線で解説します。', '料理', '料理', 'beginner', 'beginner', 'online', 9800, null, false, true),
    ('jazz-chord-intro', 'ジャズコード理論・入門', 'ピアノ・ギター・DTM 全般向け', 'ダイアトニックコードから2-5-1進行、テンションまでをコンパクトに。', '音楽', '音楽', 'intermediate', 'intermediate', 'online', 14800, 11800, true, true),
    ('home-fitness-30days', '自宅でできる30日ボディメイク', '器具なし・1日15分のトレーニング設計', 'フォーム動画付き。スマホで毎日10分の継続を目指します。', 'フィットネス', 'フィットネス', 'beginner', 'beginner', 'online', 6800, null, true, true),
    ('toeic-listening-blast', 'TOEIC リスニング集中対策', 'パート別の解法フレームワーク', '頻出パターン、シャドーイング、模試までを2週間で完了。', '語学', '語学', 'intermediate', 'intermediate', 'online', 18800, 14800, false, true),
    ('art-watercolor', 'はじめての水彩画', '道具選びから1枚仕上げまで', '初心者でも美しく描けるテクニックを動画で。色相、筆使い、構図を解説。', 'アート', 'アート', 'beginner', 'beginner', 'online', 5800, null, false, true)
    on conflict (slug) do nothing;
end$$;

-- Update existing courses' industry where null
update public.courses set industry = '学習'
  where industry is null and category in ('クラウド','プログラミング','データ','セキュリティ');

-- ============== Optional helper view ==============
-- (kept simple; not strictly required)
create or replace view public.course_summary as
select
  c.id, c.slug, c.title, c.subtitle, c.category, c.industry, c.level, c.difficulty,
  c.location_type, c.price, c.sale_price, c.duration_minutes, c.lesson_count,
  c.published, c.featured, c.active,
  c.rating_avg, c.rating_count,
  c.created_at
from public.courses c;
