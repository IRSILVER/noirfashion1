-- =====================================================================
-- NOIR FASHION — make YOUR account the administrator (no command line needed)
--
-- 1. Supabase → Authentication → Users → "Add user" → "Create new user"
--    Enter your email + a strong password and tick "Auto Confirm User".
-- 2. Replace the email below with that same email.
-- 3. SQL Editor → New query → paste this file → Run.
--
-- Only accounts listed in admin_users can open the dashboard. Nobody can add
-- themselves to this list from the website: it can only be changed here.
-- =====================================================================

insert into public.admin_users (user_id, email)
select id, email from auth.users
where lower(email) = lower('JOUW-EMAIL@VOORBEELD.NL')   -- ← change this
on conflict (user_id) do nothing;

-- Check: this should show your email. Empty? The email above does not match the user from step 1.
select email, created_at from public.admin_users;

-- To REMOVE someone's admin rights later:
-- delete from public.admin_users where lower(email) = lower('iemand@voorbeeld.nl');
