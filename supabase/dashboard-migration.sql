-- Paperless Invites: order dashboard upgrade
-- Run this once if supabase/setup.sql was already run before the dashboard existed.

begin;

alter table public.invitations add column if not exists slug text;
alter table public.invitations add column if not exists active_until date;
alter table public.invitations add column if not exists deployed_at timestamptz;
alter table public.invitations add column if not exists inactive_at timestamptz;

alter table public.invitations drop constraint if exists invitations_status_check;
alter table public.invitations drop constraint if exists invitations_active_date_check;

update public.invitations
set status = case
  when status in ('draft', 'submitted', 'in_review', 'approved') then 'pending'
  when status = 'archived' then 'inactive'
  when status in ('pending', 'active', 'inactive') then status
  else 'pending'
end;

alter table public.invitations alter column status set default 'pending';
alter table public.invitations
  add constraint invitations_status_check check (status in ('pending', 'active', 'inactive'));
alter table public.invitations
  add constraint invitations_active_date_check check (status <> 'active' or active_until is not null);

alter table public.invitations drop constraint if exists invitations_total_price_check;
alter table public.invitations
  add constraint invitations_total_price_check check (total_price >= 0);

create unique index if not exists invitations_slug_idx
  on public.invitations (slug)
  where slug is not null;

create index if not exists invitations_active_until_idx
  on public.invitations (active_until)
  where status = 'active';

drop index if exists public.invitations_status_updated_at_idx;
create index if not exists invitations_status_created_at_idx
  on public.invitations (status, created_at desc);

drop trigger if exists invitations_set_updated_at on public.invitations;
drop function if exists public.set_invitation_updated_at();
alter table public.invitations drop column if exists updated_at;

commit;
