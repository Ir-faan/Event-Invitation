-- Apply after 20260917_production_hardening.sql. No customer data is rewritten.
begin;
create or replace function public.list_invitation_orders(
  p_page integer default 1, p_size integer default 10, p_query text default '',
  p_statuses text[] default array['pending'], p_sort text default 'created_at', p_direction text default 'desc'
) returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare result jsonb;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'Not authorized'; end if;
  if p_page is null or p_size is null or p_query is null or p_statuses is null or p_sort is null or p_direction is null
    or p_page < 1 or p_page > 1000000 or p_size not in (10,25,50) or length(p_query) > 120
    or p_sort not in ('coupleName','customerName','eventDate','created_at','total_price','status')
    or p_direction not in ('asc','desc')
    or not p_statuses <@ array['pending','active','inactive']::text[] then raise exception 'Invalid pagination'; end if;
  with summaries as (
    select i.id, i.revision, i.status, i.slug, i.active_until, i.total_price, i.created_at, i.deployed_at, i.inactive_at,
      coalesce(nullif(btrim(i.config #>> '{contact,name}'), ''), 'Customer name missing') as "customerName",
      coalesce(btrim(i.config #>> '{contact,phone}'), '') as phone,
      coalesce(nullif(concat_ws(' & ', nullif(btrim(i.config #>> '{hero,firstName}'), ''), nullif(btrim(i.config #>> '{hero,secondName}'), '')), ''), 'Unnamed invitation') as "coupleName",
      coalesce((select coalesce((select item->>'date' from jsonb_array_elements(case when jsonb_typeof(s.value->'items') = 'array' then s.value->'items' else '[]'::jsonb end) with ordinality as items(item,n) where coalesce(item->>'date','') <> '' order by items.n limit 1), nullif(s.value #>> '{fields,date}', '')) from jsonb_array_elements(case when jsonb_typeof(i.config->'sections') = 'array' then i.config->'sections' else '[]'::jsonb end) with ordinality s(value,n) where s.value->>'type' = 'event-details' order by s.n limit 1),
        (select s.value #>> '{fields,date}' from jsonb_array_elements(case when jsonb_typeof(i.config->'sections') = 'array' then i.config->'sections' else '[]'::jsonb end) with ordinality s(value,n) where s.value->>'type' = 'countdown' order by s.n limit 1), '') as "eventDate",
      i.config->>'palette' as palette, i.config #>> '{opening,type}' as "openingType", i.config #>> '{hero,type}' as "heroType",
      jsonb_array_length(case when jsonb_typeof(i.config->'sections') = 'array' then i.config->'sections' else '[]'::jsonb end) as "sectionCount",
      exists(select 1 from jsonb_array_elements(case when jsonb_typeof(i.config->'sections') = 'array' then i.config->'sections' else '[]'::jsonb end) s where s->>'type' = 'custom') as "hasCustomPart",
      coalesce(i.slug, 'invitation') as "suggestedSlug"
    from public.invitations i
  ), filtered as (
    select * from summaries s
    where (cardinality(p_statuses) = 0 or s.status = any(p_statuses))
      and (p_query = '' or strpos(lower(concat_ws(' ',s."coupleName",s."customerName",s.phone,s.slug,s.id::text)), lower(p_query)) > 0)
  ), paged as (
    select * from filtered
    order by
      case when p_direction='asc' then case p_sort when 'coupleName' then lower("coupleName") when 'customerName' then lower("customerName") when 'eventDate' then "eventDate" when 'status' then case status when 'pending' then '0' when 'active' then '1' else '2' end end end asc nulls last,
      case when p_direction='desc' then case p_sort when 'coupleName' then lower("coupleName") when 'customerName' then lower("customerName") when 'eventDate' then "eventDate" when 'status' then case status when 'pending' then '0' when 'active' then '1' else '2' end end end desc nulls last,
      case when p_sort='created_at' and p_direction='asc' then created_at end asc,
      case when p_sort='created_at' and p_direction='desc' then created_at end desc,
      case when p_sort='total_price' and p_direction='asc' then total_price end asc,
      case when p_sort='total_price' and p_direction='desc' then total_price end desc,
      id
    limit p_size offset (p_page - 1) * p_size
  )
  select jsonb_build_object(
    'orders', coalesce((select jsonb_agg(to_jsonb(p)) from paged p), '[]'::jsonb),
    'total', (select count(*) from filtered),
    'totalValue', (select coalesce(sum(total_price),0) from filtered),
    'counts', jsonb_build_object('pending',(select count(*) from summaries where status='pending'), 'active',(select count(*) from summaries where status='active'), 'inactive',(select count(*) from summaries where status='inactive'))
  ) into result;
  return result;
end; $$;
revoke all on function public.list_invitation_orders(integer,integer,text,text[],text,text) from public, anon, authenticated;
grant execute on function public.list_invitation_orders(integer,integer,text,text[],text,text) to service_role;
commit;
notify pgrst, 'reload schema';
