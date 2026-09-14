-- Run AFTER the new application code is live. No submitted order is editable by customers.
-- Do not drop created_at, deployed_at or inactive_at: the dashboard still uses these.
begin;

drop index if exists public.invitations_edit_token_hash_idx;
alter table public.invitations drop column if exists edit_token_hash;
drop index if exists public.invitations_status_updated_at_idx;
drop trigger if exists invitations_set_updated_at on public.invitations;
drop function if exists public.set_invitation_updated_at();
alter table public.invitations drop column if exists updated_at;

commit;
