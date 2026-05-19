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
