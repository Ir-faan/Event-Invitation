-- Apply AFTER media-commit-migration.sql and admin-auth.sql, BEFORE deploying this branch.
-- Additive: existing invitations, URLs, media and old RPC signatures are preserved.
begin;

alter table public.invitations add column if not exists revision bigint not null default 1;
create or replace function public.bump_invitation_revision() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin new.revision := old.revision + 1; return new; end; $$;
drop trigger if exists invitations_revision on public.invitations;
create trigger invitations_revision before update on public.invitations
for each row execute function public.bump_invitation_revision();

create table if not exists public.request_limits (
  key text primary key check (length(key) = 64),
  attempts integer not null,
  expires_at timestamptz not null
);
create index if not exists request_limits_expiry_idx on public.request_limits(expires_at);
alter table public.request_limits enable row level security;
revoke all on public.request_limits from public, anon, authenticated;
grant all on public.request_limits to service_role;

create or replace function public.consume_request_limit(p_key text, p_limit integer, p_seconds integer)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare used integer;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'Not authorized'; end if;
  if length(p_key) <> 64 or p_limit < 1 or p_limit > 100000 or p_seconds < 1 or p_seconds > 86400 then raise exception 'Invalid limit'; end if;
  delete from public.request_limits where expires_at < now() - interval '1 day';
  insert into public.request_limits as limits(key, attempts, expires_at)
  values (p_key, 1, now() + make_interval(secs => p_seconds))
  on conflict (key) do update set
    attempts = case when limits.expires_at <= now() then 1 else least(limits.attempts + 1, p_limit + 1) end,
    expires_at = case when limits.expires_at <= now() then now() + make_interval(secs => p_seconds) else limits.expires_at end
  returning attempts into used;
  return used <= p_limit;
end; $$;

-- Every new object is recorded BEFORE upload. Uncommitted objects expire after
-- two hours, beyond the 30-minute receipt lifetime. Committing media removes its
-- staged job. Deleting media transactionally records an immediate cleanup job.
create table if not exists public.media_cleanup (
  storage_path text primary key,
  invitation_id uuid,
  slot text,
  digest text,
  mime_type text,
  size_bytes bigint,
  uploaded boolean not null default false,
  delete_after timestamptz not null default now() + interval '2 hours',
  lease_token uuid
);
create index if not exists media_cleanup_due_idx on public.media_cleanup(delete_after);
alter table public.media_cleanup enable row level security;
revoke all on public.media_cleanup from public, anon, authenticated;
grant all on public.media_cleanup to service_role;

create or replace function public.track_media_cleanup() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'INSERT' then
    delete from public.media_cleanup where storage_path = new.storage_path;
    return new;
  end if;
  insert into public.media_cleanup(storage_path, invitation_id, delete_after)
  values (old.storage_path, old.invitation_id, now())
  on conflict (storage_path) do update set delete_after = now(), lease_token = null;
  return old;
end; $$;
drop trigger if exists media_cleanup_insert on public.invitation_media;
drop trigger if exists media_cleanup_delete on public.invitation_media;
create trigger media_cleanup_insert after insert on public.invitation_media
for each row execute function public.track_media_cleanup();
create trigger media_cleanup_delete after delete on public.invitation_media
for each row execute function public.track_media_cleanup();

create or replace function public.claim_media_cleanup(p_limit integer default 20)
returns setof public.media_cleanup language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.role() is distinct from 'service_role' then raise exception 'Not authorized'; end if;
  return query
  update public.media_cleanup as jobs set lease_token = gen_random_uuid(), delete_after = now() + interval '5 minutes'
  where jobs.storage_path in (
    select job.storage_path from public.media_cleanup as job
    where job.delete_after <= now()
      and not exists (select 1 from public.invitation_media as media where media.storage_path = job.storage_path)
    order by job.delete_after limit greatest(1, least(p_limit, 50)) for update skip locked
  ) returning jobs.*;
end; $$;

create or replace function public.update_invitation_with_media(
  p_id uuid, p_values jsonb, p_media jsonb
) returns setof public.invitations
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.role() is distinct from 'service_role' then raise exception 'Not authorized'; end if;
  if p_values is null or jsonb_typeof(p_values) <> 'object'
    or p_media is null or jsonb_typeof(p_media) <> 'array' or jsonb_array_length(p_media) > 32 then
    raise exception 'Invalid order update';
  end if;
  update public.invitations as invitation set
    config = case when p_values ? 'config' then p_values->'config' else invitation.config end,
    total_price = case when p_values ? 'total_price' then (p_values->>'total_price')::integer else invitation.total_price end,
    status = case when p_values ? 'status' then p_values->>'status' else invitation.status end,
    slug = case when p_values ? 'slug' then p_values->>'slug' else invitation.slug end,
    active_until = case when p_values ? 'active_until' then (p_values->>'active_until')::date else invitation.active_until end,
    deployed_at = case when p_values ? 'deployed_at' then (p_values->>'deployed_at')::timestamptz else invitation.deployed_at end,
    inactive_at = case when p_values ? 'inactive_at' then (p_values->>'inactive_at')::timestamptz else invitation.inactive_at end
  where invitation.id = p_id;
  if not found then raise exception 'Order not found'; end if;

  insert into public.invitation_media (invitation_id, storage_path, public_url, slot, mime_type, size_bytes)
  select p_id, photo.storage_path, photo.public_url, photo.slot, photo.mime_type, photo.size_bytes
  from jsonb_to_recordset(p_media) as photo(
    storage_path text, public_url text, slot text, mime_type text, size_bytes bigint
  );
  -- Removing a saved image also removes its metadata in this same transaction.
  if p_values ? 'config' then
    delete from public.invitation_media as media
    where media.invitation_id = p_id
      and media.public_url <> coalesce(p_values->'config'->'hero'->>'uploadedUrl', '')
      and not exists (
        select 1
        from jsonb_array_elements(coalesce(p_values->'config'->'sections', '[]'::jsonb)) as section(value)
        cross join lateral jsonb_array_elements_text(coalesce(section.value->'images', '[]'::jsonb)) as image(value)
        where image.value = media.public_url
      )
      and not exists (
        select 1 from jsonb_array_elements(coalesce(p_values->'config'->'sections', '[]'::jsonb)) as section(value)
        where section.value->>'type' = 'custom'
          and (strpos(coalesce(section.value #>> '{fields,html}', ''), media.public_url) > 0
            or strpos(coalesce(section.value #>> '{fields,css}', ''), media.public_url) > 0)
      );
  end if;
  return query select * from public.invitations where id = p_id;
end;
$$;


create or replace function public.save_invitation_version(p_id uuid, p_values jsonb, p_media jsonb, p_revision bigint)
returns setof public.invitations language plpgsql security definer set search_path = public, pg_temp as $$
declare current_revision bigint;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'Not authorized'; end if;
  select revision into current_revision from public.invitations where id = p_id for update;
  if not found then raise sqlstate 'P0002' using message = 'Order not found'; end if;
  if p_revision is null or current_revision <> p_revision then raise sqlstate 'PT409' using message = 'Order changed. Reload before saving.'; end if;
  return query select * from public.update_invitation_with_media(p_id, p_values, p_media);
end; $$;

create or replace function public.delete_invitation_version(p_id uuid, p_revision bigint)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare current_revision bigint;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'Not authorized'; end if;
  select revision into current_revision from public.invitations where id = p_id for update;
  if not found then return false; end if;
  if p_revision is null or current_revision <> p_revision then raise sqlstate 'PT409' using message = 'Order changed. Reload before deleting.'; end if;
  delete from public.invitations where id = p_id;
  return true;
end; $$;

create index if not exists invitations_created_id_idx on public.invitations(created_at desc, id);

revoke all on function public.consume_request_limit(text,integer,integer) from public, anon, authenticated;
revoke all on function public.claim_media_cleanup(integer) from public, anon, authenticated;
revoke all on function public.save_invitation_version(uuid,jsonb,jsonb,bigint) from public, anon, authenticated;
revoke all on function public.delete_invitation_version(uuid,bigint) from public, anon, authenticated;
revoke all on function public.track_media_cleanup() from public, anon, authenticated;
revoke all on function public.bump_invitation_revision() from public, anon, authenticated;
grant execute on function public.consume_request_limit(text,integer,integer) to service_role;
grant execute on function public.claim_media_cleanup(integer) to service_role;
grant execute on function public.save_invitation_version(uuid,jsonb,jsonb,bigint) to service_role;
grant execute on function public.delete_invitation_version(uuid,bigint) to service_role;
commit;
notify pgrst, 'reload schema';
