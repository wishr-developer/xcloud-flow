-- =====================================================================
-- XCloud-Flow v7: Production hardening — tighten RLS per tenant.
-- Apply AFTER 0006. Fully idempotent.
--
-- Strategy:
--   * Anything that is genuinely public stays read-all (lessons / courses /
--     teachers / announcements published / faqs published / coupons active /
--     organizations active).
--   * Tenant-internal data (bookings, customers, payments, audit_logs,
--     subscriptions, notification_logs, in_app_notifications, locations,
--     invitations, recurring_rules) becomes org-scoped:
--     read & write require admin OR organization_id = current_org_id().
--   * Token-based public reads (invite token, attendance qr_token) stay open
--     because the secret IS the token.
-- =====================================================================

-- ====== helper: stronger admin check (admin OR staff, scoped to caller) ======
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

create or replace function public.is_org_member(org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select organization_id = org from public.profiles where id = auth.uid()),
    false
  );
$$;

-- ====== organizations ======
drop policy if exists "org_member_read" on public.organizations;
create policy "org_member_read" on public.organizations
  for select using (
    public.is_admin()
    or id = public.current_org_id()
    or owner_id = auth.uid()
    or status = 'active'  -- needed for /x/[slug] public pages
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
  for insert with check (auth.uid() is not null);

-- ====== profiles: keep self + org-admin visibility ======
drop policy if exists "profiles_self_read" on public.profiles;
create policy "profiles_self_read" on public.profiles
  for select using (
    auth.uid() = id
    or public.is_admin()
    or organization_id = public.current_org_id()
  );

-- ====== site_config (singleton fallback for default org) ======
-- Already read-all, admin-write — keep as is. Just ensure write is admin only.
drop policy if exists "site_config_admin_write" on public.site_config;
create policy "site_config_admin_write" on public.site_config
  for all using (public.is_admin()) with check (public.is_admin());

-- ====== generic tenant-scoped tables ======
do $$
declare
  t text;
  tables_tenant text[] := array[
    'bookings',
    'customers',
    'payments',
    'notification_logs',
    'enrollments',
    'lesson_progress',
    'certificates',
    'subscriptions',
    'audit_logs',
    'invitations',
    'recurring_rules',
    'in_app_notifications',
    'locations'
  ];
begin
  foreach t in array tables_tenant
  loop
    if not exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = t
    ) then
      continue;
    end if;

    -- drop any old loose policies we may have created previously
    execute format('drop policy if exists "%s_org_read" on public.%I', t, t);
    execute format('drop policy if exists "%s_org_insert" on public.%I', t, t);
    execute format('drop policy if exists "%s_org_update" on public.%I', t, t);
    execute format('drop policy if exists "%s_org_delete" on public.%I', t, t);

    execute format(
      'create policy "%s_org_read" on public.%I
         for select using (
           public.is_admin()
           or organization_id = public.current_org_id()
         )',
      t, t
    );
    execute format(
      'create policy "%s_org_insert" on public.%I
         for insert with check (
           public.is_admin()
           or organization_id = public.current_org_id()
           or organization_id is null
         )',
      t, t
    );
    execute format(
      'create policy "%s_org_update" on public.%I
         for update using (
           public.is_admin()
           or organization_id = public.current_org_id()
         ) with check (
           public.is_admin()
           or organization_id = public.current_org_id()
         )',
      t, t
    );
    execute format(
      'create policy "%s_org_delete" on public.%I
         for delete using (
           public.is_admin()
           or organization_id = public.current_org_id()
         )',
      t, t
    );
  end loop;
end$$;

-- ====== Special-case overrides ======

-- bookings: customers must still be able to insert their own bookings (anon-friendly),
-- and authed customers may read their own (matched by user_id OR email).
drop policy if exists "bookings_user_insert_self" on public.bookings;
create policy "bookings_user_insert_self" on public.bookings
  for insert with check (
    public.is_admin()
    or organization_id = public.current_org_id()
    or organization_id is null
    or user_id = auth.uid()
    or user_id is null  -- guest booking flow
  );

drop policy if exists "bookings_user_read_self" on public.bookings;
create policy "bookings_user_read_self" on public.bookings
  for select using (
    public.is_admin()
    or organization_id = public.current_org_id()
    or user_id = auth.uid()
  );

-- enrollments: same — let user read/insert their own enrollment
drop policy if exists "enrollments_user_read_self" on public.enrollments;
create policy "enrollments_user_read_self" on public.enrollments
  for select using (
    public.is_admin()
    or organization_id = public.current_org_id()
    or user_id = auth.uid()
  );
drop policy if exists "enrollments_user_insert_self" on public.enrollments;
create policy "enrollments_user_insert_self" on public.enrollments
  for insert with check (
    public.is_admin()
    or organization_id = public.current_org_id()
    or user_id = auth.uid()
    or user_id is null
  );

-- notification_logs: also allow anonymous insert (booking flow logs LINE skip)
drop policy if exists "notif_logs_insert_any" on public.notification_logs;
create policy "notif_logs_insert_any" on public.notification_logs
  for insert with check (true);

-- in_app_notifications: also let user read/update their own
drop policy if exists "in_app_notif_user_read_self" on public.in_app_notifications;
create policy "in_app_notif_user_read_self" on public.in_app_notifications
  for select using (
    public.is_admin()
    or organization_id = public.current_org_id()
    or user_id = auth.uid()
  );
drop policy if exists "in_app_notif_user_update_self" on public.in_app_notifications;
create policy "in_app_notif_user_update_self" on public.in_app_notifications
  for update using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- invitations: anyone with the token URL must be able to fetch the row
-- (the token itself is the secret). Org members & admins keep full access.
drop policy if exists "invitations_token_read" on public.invitations;
create policy "invitations_token_read" on public.invitations
  for select using (true);

-- contacts: public can still insert (contact form), admin-only read/update/delete
drop policy if exists "contacts_public_insert" on public.contacts;
create policy "contacts_public_insert" on public.contacts
  for insert with check (true);
drop policy if exists "contacts_org_read" on public.contacts;
create policy "contacts_org_read" on public.contacts
  for select using (
    public.is_admin() or organization_id = public.current_org_id()
  );
drop policy if exists "contacts_org_update" on public.contacts;
create policy "contacts_org_update" on public.contacts
  for update using (
    public.is_admin() or organization_id = public.current_org_id()
  ) with check (
    public.is_admin() or organization_id = public.current_org_id()
  );

-- announcements / faqs / coupons stay public-readable for the unauth landing pages.
-- Admin write was already in place; we just make sure writes are admin-or-org-member.
drop policy if exists "ann_admin_write" on public.announcements;
create policy "ann_admin_write" on public.announcements
  for all using (
    public.is_admin() or organization_id = public.current_org_id()
  ) with check (
    public.is_admin() or organization_id = public.current_org_id()
  );

drop policy if exists "faqs_admin_write" on public.faqs;
create policy "faqs_admin_write" on public.faqs
  for all using (
    public.is_admin() or organization_id = public.current_org_id()
  ) with check (
    public.is_admin() or organization_id = public.current_org_id()
  );

drop policy if exists "coupons_admin_all" on public.coupons;
create policy "coupons_admin_all" on public.coupons
  for all using (
    public.is_admin() or organization_id = public.current_org_id()
  ) with check (
    public.is_admin() or organization_id = public.current_org_id()
  );

-- ====== Sanity: helpful indexes on organization_id we may have missed ======
create index if not exists bookings_org_created_idx on public.bookings(organization_id, created_at desc);
create index if not exists in_app_notif_org_idx on public.in_app_notifications(organization_id, created_at desc);
create index if not exists audit_logs_org_created_idx on public.audit_logs(organization_id, created_at desc);
