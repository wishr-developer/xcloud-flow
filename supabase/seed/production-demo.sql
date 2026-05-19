-- =====================================================================
-- XCloud-Flow — production demo seed (RUN MANUALLY)
--
-- Creates two demo organizations (Yoga / Music) so the public landing
-- pages /x/demo-yoga-studio and /x/demo-music-academy can be reached
-- without going through onboarding.
--
-- Idempotent: re-running the file only updates timestamps.
-- Run AFTER migrations 0001 → 0007 are applied.
-- =====================================================================

-- ====== Yoga Studio ======
insert into public.organizations (
  name, slug, business_type, plan, status, primary_color,
  tagline, hero_copy, chat_opening_message, sample_categories,
  onboarding_completed
)
values (
  'XCloud Yoga Studio',
  'demo-yoga-studio',
  'yoga',
  'free',
  'active',
  '#0EA5E9',
  '朝活ヨガからオンラインクラスまで。',
  '心と体を整える、まいにちのヨガ習慣。',
  'ようこそ！ヨガクラスのご予約ですね。初心者向け / 経験者向け、ご希望の時間帯を教えてください。',
  array['ハタヨガ','陰ヨガ','パワーヨガ','オンライン'],
  true
)
on conflict (slug) do update set
  business_type = excluded.business_type,
  primary_color = excluded.primary_color,
  tagline = excluded.tagline,
  hero_copy = excluded.hero_copy,
  chat_opening_message = excluded.chat_opening_message,
  sample_categories = excluded.sample_categories,
  onboarding_completed = true,
  updated_at = now();

-- ====== Music Academy ======
insert into public.organizations (
  name, slug, business_type, plan, status, primary_color,
  tagline, hero_copy, chat_opening_message, sample_categories,
  onboarding_completed
)
values (
  'XCloud Music Academy',
  'demo-music-academy',
  'music',
  'free',
  'active',
  '#7C3AED',
  'ピアノ・ボーカル・ギター 大人初心者歓迎。',
  '楽器に触れたことがない方でも、3か月で1曲弾けるをサポートします。',
  'こんにちは！音楽レッスンの体験予約を承ります。楽器と希望日時を教えてください。',
  array['ピアノ','ボーカル','ギター','ドラム'],
  true
)
on conflict (slug) do update set
  business_type = excluded.business_type,
  primary_color = excluded.primary_color,
  tagline = excluded.tagline,
  hero_copy = excluded.hero_copy,
  chat_opening_message = excluded.chat_opening_message,
  sample_categories = excluded.sample_categories,
  onboarding_completed = true,
  updated_at = now();

-- ====== Teachers (org-scoped) ======
with yoga as (select id from public.organizations where slug = 'demo-yoga-studio')
insert into public.teachers (organization_id, name, email, bio, active)
select yoga.id, t.name, t.email, t.bio, true from yoga, (values
  ('佐藤 千夏', 'chinatsu@example.com', 'ヨガ歴14年。RYT500保持。'),
  ('Lily Tanaka',  'lily@example.com',     '陰ヨガ・瞑想クラス専門。')
) as t(name, email, bio)
on conflict do nothing;

with music as (select id from public.organizations where slug = 'demo-music-academy')
insert into public.teachers (organization_id, name, email, bio, active)
select music.id, t.name, t.email, t.bio, true from music, (values
  ('Hiro Yamashita', 'hiro@example.com',  'ジャズピアニスト。大人初心者を中心に指導。'),
  ('Mai Kuroda',     'mai@example.com',   'ボイストレーナー。大手レーベル経験あり。')
) as t(name, email, bio)
on conflict do nothing;

-- ====== Lessons (org-scoped) ======
with yoga as (select id from public.organizations where slug = 'demo-yoga-studio')
insert into public.lessons (
  organization_id, title, description, duration_minutes, price, capacity,
  active, category, difficulty, location_type, target_audience, required_items
)
select yoga.id, l.title, l.description, l.duration_minutes, l.price, l.capacity,
       true, l.category, l.difficulty, l.location_type, l.target_audience, l.required_items
from yoga, (values
  ('朝ヨガ・リフレッシュ60分', '初心者向け。呼吸と簡単なアーサナで身体を起こします。', 60, 2800, 8, 'ハタヨガ', 'beginner', 'offline', '初心者・女性に人気', 'ヨガマット (貸出可)'),
  ('陰ヨガ・夜の癒し75分',     '深い呼吸とゆっくりしたポーズで自律神経を整えます。', 75, 3200, 6, '陰ヨガ',   'beginner', 'offline', '日中働く方', 'ヨガマット (貸出可)'),
  ('オンライン朝活ヨガ',         '自宅から参加できる30分のショートクラス。',          30, 1500, 30,'オンライン','beginner', 'online',  '在宅ワーカー', 'ヨガマット (推奨)')
) as l(title, description, duration_minutes, price, capacity, category, difficulty, location_type, target_audience, required_items)
on conflict do nothing;

with music as (select id from public.organizations where slug = 'demo-music-academy')
insert into public.lessons (
  organization_id, title, description, duration_minutes, price, capacity,
  active, category, difficulty, location_type, target_audience, required_items
)
select music.id, l.title, l.description, l.duration_minutes, l.price, l.capacity,
       true, l.category, l.difficulty, l.location_type, l.target_audience, l.required_items
from music, (values
  ('ピアノ体験レッスン60分',  'マンツーマン。コードの仕組みを解説。',           60, 5500, 1, 'ピアノ',  'beginner', 'offline', '大人初心者',     'ノート'),
  ('ボーカル体験45分',         '発声・ピッチ・呼吸を体験できます。',             45, 4800, 1, 'ボーカル','beginner', 'offline', '歌が好きな方', '飲み物'),
  ('オンライン作曲入門',       'DAW不要。コード理論を中心にオンラインで学ぶ。', 60, 4200, 1, '作曲',    'beginner', 'online',  '社会人',         'ヘッドセット')
) as l(title, description, duration_minutes, price, capacity, category, difficulty, location_type, target_audience, required_items)
on conflict do nothing;

-- ====== Booking slots: next 7 days ======
do $$
declare
  yoga_org uuid;
  music_org uuid;
  l record;
  d int;
  iso_date date;
begin
  select id into yoga_org from public.organizations where slug = 'demo-yoga-studio';
  select id into music_org from public.organizations where slug = 'demo-music-academy';
  if yoga_org is null and music_org is null then return; end if;

  for d in 1..7 loop
    iso_date := current_date + d;

    if yoga_org is not null then
      for l in
        select id, price, duration_minutes from public.lessons
         where organization_id = yoga_org and active = true
      loop
        insert into public.booking_slots (
          organization_id, lesson_id, date, start_time, end_time,
          capacity, booked_count, price, status
        ) values (
          yoga_org, l.id, iso_date,
          '07:00:00',
          (time '07:00:00' + (l.duration_minutes || ' minutes')::interval)::time,
          8, 0, l.price, 'open'
        ) on conflict do nothing;
      end loop;
    end if;

    if music_org is not null then
      for l in
        select id, price, duration_minutes from public.lessons
         where organization_id = music_org and active = true
      loop
        insert into public.booking_slots (
          organization_id, lesson_id, date, start_time, end_time,
          capacity, booked_count, price, status
        ) values (
          music_org, l.id, iso_date,
          '18:00:00',
          (time '18:00:00' + (l.duration_minutes || ' minutes')::interval)::time,
          1, 0, l.price, 'open'
        ) on conflict do nothing;
      end loop;
    end if;
  end loop;
end$$;

-- ====== FAQ + Announcement per org ======
with yoga as (select id from public.organizations where slug = 'demo-yoga-studio')
insert into public.faqs (organization_id, category, question, answer, order_index, published)
select yoga.id, '受講について', '当日キャンセルはできますか？', '前日21:00までのキャンセルは無料です。当日キャンセルは1回分消化となります。', 0, true
from yoga
on conflict do nothing;

with music as (select id from public.organizations where slug = 'demo-music-academy')
insert into public.faqs (organization_id, category, question, answer, order_index, published)
select music.id, '受講について', '楽器を持っていなくても受講できますか？', 'はい。教室の楽器をご利用いただけます。オンラインクラスは別途ご相談ください。', 0, true
from music
on conflict do nothing;

with yoga as (select id from public.organizations where slug = 'demo-yoga-studio')
insert into public.announcements (organization_id, title, body, pinned, published)
select yoga.id, '体験キャンペーン開催中', '今月限定で体験レッスンが500円OFF。クーポンコード "WELCOME20" をご利用ください。', true, true
from yoga
on conflict do nothing;

with music as (select id from public.organizations where slug = 'demo-music-academy')
insert into public.announcements (organization_id, title, body, pinned, published)
select music.id, '新ピアノ講師が加わりました', '4月よりHiro Yamashita先生が体験レッスンを開講します。', true, true
from music
on conflict do nothing;

-- ====== Default subscriptions ======
insert into public.subscriptions (organization_id, plan, status)
select id, 'free', 'active' from public.organizations
 where slug in ('demo-yoga-studio','demo-music-academy')
   and id not in (select organization_id from public.subscriptions where organization_id is not null);
