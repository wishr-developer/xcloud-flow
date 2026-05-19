-- =====================================================================
-- XCloud Flow — Verification SQL
-- Run after 0001_init.sql + 0002_xcloud_flow.sql.
-- Each query should return non-empty results.
-- =====================================================================

-- 1) すべての必須テーブルが存在するか
select tablename
from pg_tables
where schemaname = 'public'
  and tablename in (
    -- 0001
    'profiles','teachers','lessons','booking_slots','bookings',
    'customers','notification_logs','payments','app_settings',
    -- 0002
    'courses','course_modules','course_lessons','enrollments',
    'lesson_progress','certificates','course_reviews',
    'announcements','faqs','coupons','contacts'
  )
order by tablename;
-- 期待値: 19行 (上記すべて)

-- 2) RLS が有効か
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'profiles','teachers','lessons','booking_slots','bookings',
    'customers','notification_logs','payments','app_settings',
    'courses','course_modules','course_lessons','enrollments',
    'lesson_progress','certificates','course_reviews',
    'announcements','faqs','coupons','contacts'
  )
order by tablename;
-- 期待値: rowsecurity がすべて true

-- 3) 重要な関数とトリガーが存在するか
select proname from pg_proc
where proname in ('handle_new_user','is_admin','refresh_course_aggregates','touch_courses_updated_at')
order by proname;
-- 期待値: 4行

-- 4) シードデータが入っているか
select 'teachers'  as t, count(*) as c from public.teachers
union all
select 'lessons'   , count(*) from public.lessons
union all
select 'courses'   , count(*) from public.courses
union all
select 'modules'   , count(*) from public.course_modules
union all
select 'c_lessons' , count(*) from public.course_lessons
union all
select 'announcements', count(*) from public.announcements
union all
select 'faqs'      , count(*) from public.faqs
union all
select 'coupons'   , count(*) from public.coupons;
-- 期待値の目安:
--   teachers >= 2, lessons >= 3, courses >= 4,
--   modules >= 2, c_lessons >= 4,
--   announcements >= 2, faqs >= 4, coupons >= 2

-- 5) RLS ポリシー数 (概ね 30 件以上あれば OK)
select count(*) as policy_count from pg_policies where schemaname = 'public';

-- 6) auth user → profiles 自動作成トリガーが付いているか
select tgname from pg_trigger
where tgname = 'on_auth_user_created'
  and tgrelid = 'auth.users'::regclass;
-- 期待値: 1行

-- 7) 自分を管理者に昇格させたい場合 (実行後にやる)
-- update public.profiles set role = 'admin' where email = 'YOUR_EMAIL_HERE';
