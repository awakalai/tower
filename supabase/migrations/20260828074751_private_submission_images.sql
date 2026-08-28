-- Keep seller-submitted media private until the listing is approved and published.
-- Stored database values are object paths, never permanent public or signed URLs.

update storage.buckets
set public = false
where id = 'property-submissions';

drop policy if exists "Submission images are publicly readable" on storage.objects;
drop policy if exists "Permitted users read submission images" on storage.objects;

create or replace function private.can_read_property_submission_image(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  with path_parts as (
    select
      private.safe_uuid((storage.foldername(object_name))[1]) as owner_id,
      private.safe_uuid((storage.foldername(object_name))[2]) as submission_id
  )
  select exists (
    select 1
    from path_parts
    join public.property_submissions submission
      on submission.id = path_parts.submission_id
     and submission.owner_id = path_parts.owner_id
    where object_name = any(submission.image_urls)
      and (
        submission.owner_id = (select auth.uid())
        or exists (
          select 1
          from public.organization_members membership
          where membership.organization_id = submission.organization_id
            and membership.user_id = (select auth.uid())
            and membership.is_active
        )
        or (
          submission.status = 'approved'
          and submission.approved_property_id is not null
          and exists (
            select 1
            from public.properties property
            where property.id = submission.approved_property_id
              and property.is_published
              and (
                property.image_url = object_name
                or object_name = any(property.gallery)
              )
          )
        )
      )
  );
$$;

revoke all on function private.can_read_property_submission_image(text) from public, anon, authenticated;
grant usage on schema private to anon;
grant execute on function private.can_read_property_submission_image(text) to anon, authenticated;

create policy "Permitted users read submission images"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'property-submissions'
  and storage.allow_any_operation(array[
    'object.get_authenticated_info',
    'object.get_authenticated'
  ])
  and private.can_read_property_submission_image(name)
);

create or replace function private.validate_property_submission_images()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  invalid_image boolean;
begin
  select exists (
    select 1
    from unnest(new.image_urls) as image(path)
    where image.path is null
      or storage.foldername(image.path) is distinct from array[new.owner_id::text, new.id::text]
      or storage.filename(image.path) !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp|avif)$'
      or not exists (
        select 1
        from storage.objects object
        where object.bucket_id = 'property-submissions'
          and object.name = image.path
      )
  ) into invalid_image;

  if invalid_image then
    raise exception 'Submission images must be uploaded to the owner submission folder first';
  end if;

  if (
    select count(*) <> count(distinct image.path)
    from unnest(new.image_urls) as image(path)
  ) then
    raise exception 'Duplicate submission images are not allowed';
  end if;

  return new;
end;
$$;

revoke all on function private.validate_property_submission_images() from public, anon, authenticated;

drop trigger if exists property_submissions_validate_images on public.property_submissions;
create trigger property_submissions_validate_images
before insert or update of image_urls on public.property_submissions
for each row execute function private.validate_property_submission_images();

