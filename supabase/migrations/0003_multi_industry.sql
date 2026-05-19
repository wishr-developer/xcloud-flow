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
