-- Optional, read-only audit for older submissions made before atomic media commits.
-- A result means the media table points at a Storage object that is missing.
select media.invitation_id, media.storage_path, media.slot, media.created_at
from public.invitation_media as media
left join storage.objects as stored
  on stored.bucket_id = 'invitation-media' and stored.name = media.storage_path
where stored.id is null
order by media.created_at desc;
