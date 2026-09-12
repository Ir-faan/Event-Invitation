-- Paperless Invites: invitation designer storage
-- Run this entire file once in Supabase Dashboard > SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  -- Retained as a one-time photo-upload credential. It does not allow customers
  -- to reopen or edit submitted orders.
  edit_token_hash text not null,
  config jsonb not null check (jsonb_typeof(config) = 'object'),
  total_price integer not null default 1000 check (total_price >= 0),
  status text not null default 'pending' check (status in ('pending', 'active', 'inactive')),
  slug text,
  active_until date,
  deployed_at timestamptz,
  inactive_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

-- These statements also upgrade projects created with the original designer script.
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

create unique index if not exists invitations_edit_token_hash_idx
  on public.invitations (id, edit_token_hash);

drop index if exists public.invitations_status_updated_at_idx;
create index if not exists invitations_status_created_at_idx
  on public.invitations (status, created_at desc);

create unique index if not exists invitations_slug_idx
  on public.invitations (slug)
  where slug is not null;

create index if not exists invitations_active_until_idx
  on public.invitations (active_until)
  where status = 'active';

create table if not exists public.invitation_media (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  storage_path text not null unique,
  public_url text not null,
  slot text not null,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 5242880),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists invitation_media_invitation_id_idx
  on public.invitation_media (invitation_id, created_at);

drop trigger if exists invitations_set_updated_at on public.invitations;
drop function if exists public.set_invitation_updated_at();
alter table public.invitations drop column if exists updated_at;

alter table public.invitations enable row level security;
alter table public.invitation_media enable row level security;

-- The browser never receives the service-role key. The app's server routes perform
-- validated reads and writes and can bypass RLS with that server-only key.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'invitation-media',
  'invitation-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
