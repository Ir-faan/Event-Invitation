-- Apply BEFORE deploying the Supabase Auth dashboard.
-- Admin membership is server-only; an Auth login by itself never grants order access.
create table if not exists public.dashboard_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.dashboard_admins enable row level security;
revoke all on table public.dashboard_admins from public, anon, authenticated;
grant select on table public.dashboard_admins to service_role;

-- After creating your admin in Authentication > Users, replace the email below
-- with the exact email used there; confirm this returns exactly one user_id.
-- insert into public.dashboard_admins (user_id)
-- select id from auth.users where email = 'admin@example.com'
-- on conflict (user_id) do nothing
-- returning user_id;

-- Check whether an existing invitation uses the newly reserved /login URL.
select id, slug from public.invitations where slug = 'login';
