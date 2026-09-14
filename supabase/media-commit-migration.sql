-- Run BEFORE deploying the new upload routes. Safe with the currently deployed code.
-- The database insert and its invitation_media inserts now share one transaction.
begin;

do $$ begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'invitations' and column_name = 'edit_token_hash') then
    alter table public.invitations alter column edit_token_hash drop not null;
  end if;
end $$;

create or replace function public.create_invitation_with_media(
  p_id uuid, p_slug text, p_config jsonb, p_total_price integer, p_media jsonb default '[]'::jsonb
) returns setof public.invitations
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.role() <> 'service_role' then raise exception 'Not authorized'; end if;
  if p_media is null or jsonb_typeof(p_media) <> 'array' or jsonb_array_length(p_media) > 32 then
    raise exception 'Invalid photo list';
  end if;
  insert into public.invitations (id, slug, config, total_price, status)
  values (p_id, p_slug, p_config, p_total_price, 'pending');

  insert into public.invitation_media (invitation_id, storage_path, public_url, slot, mime_type, size_bytes)
  select p_id, photo.storage_path, photo.public_url, photo.slot, photo.mime_type, photo.size_bytes
  from jsonb_to_recordset(p_media) as photo(
    storage_path text, public_url text, slot text, mime_type text, size_bytes bigint
  );
  return query select * from public.invitations where id = p_id;
end;
$$;

create or replace function public.update_invitation_with_media(
  p_id uuid, p_values jsonb, p_media jsonb
) returns setof public.invitations
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.role() <> 'service_role' then raise exception 'Not authorized'; end if;
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
      );
  end if;
  return query select * from public.invitations where id = p_id;
end;
$$;

revoke all on function public.create_invitation_with_media(uuid,text,jsonb,integer,jsonb) from public, anon, authenticated;
revoke all on function public.update_invitation_with_media(uuid,jsonb,jsonb) from public, anon, authenticated;
grant execute on function public.create_invitation_with_media(uuid,text,jsonb,integer,jsonb) to service_role;
grant execute on function public.update_invitation_with_media(uuid,jsonb,jsonb) to service_role;

commit;
notify pgrst, 'reload schema';
