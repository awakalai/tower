-- Public seller onboarding and moderated property publication workflow.
-- Sellers never receive organization access. They can submit and read only their
-- own listings; organization leaders review them and approval publishes a
-- property atomically inside the database.

create type public.property_submission_status as enum (
  'submitted',
  'under_review',
  'approved',
  'rejected'
);

alter table public.contacts
  add column portal_user_id uuid references auth.users(id) on delete set null;

create unique index contacts_org_portal_user_idx
on public.contacts (organization_id, portal_user_id)
where portal_user_id is not null;
create index contacts_portal_user_idx
on public.contacts (portal_user_id)
where portal_user_id is not null;

create table public.property_submissions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null default '00000000-0000-4000-8000-000000000001'
    references public.organizations(id) on delete restrict,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete restrict,
  status public.property_submission_status not null default 'submitted',
  submission_locale text not null default 'ku' check (submission_locale in ('en', 'ku', 'ar')),
  title text not null check (length(btrim(title)) between 2 and 120),
  description text not null default '' check (length(description) <= 4000),
  property_type public.property_type not null,
  price numeric(14, 2) not null check (price > 0 and price <= 999999999),
  currency char(3) not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  area_m2 numeric(12, 2) not null check (area_m2 > 0 and area_m2 <= 10000000),
  address text not null check (length(btrim(address)) between 2 and 240),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  location extensions.geography(Point, 4326)
    generated always as (
      extensions.st_setsrid(extensions.st_makepoint(longitude, latitude), 4326)::extensions.geography
    ) stored,
  image_urls text[] not null check (cardinality(image_urls) between 1 and 12),
  payment_options public.payment_method[] not null default array['cash']::public.payment_method[]
    check (cardinality(payment_options) between 1 and 3),
  contact_name text not null check (length(btrim(contact_name)) between 2 and 160),
  contact_phone text not null check (length(btrim(contact_phone)) between 6 and 40),
  contact_email text not null default '' check (length(contact_email) <= 320),
  bedrooms smallint check (bedrooms is null or bedrooms between 0 and 100),
  bathrooms smallint check (bathrooms is null or bathrooms between 0 and 100),
  floors smallint check (floors is null or floors between 0 and 200),
  parking_spaces smallint check (parking_spaces is null or parking_spaces between 0 and 1000),
  year_built smallint check (year_built is null or year_built between 1800 and 2200),
  features text[] not null default '{}' check (cardinality(features) <= 50),
  reviewer_notes text not null default '' check (length(reviewer_notes) <= 4000),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  approved_property_id uuid unique references public.properties(id) on delete set null,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (status in ('submitted', 'under_review') and reviewed_at is null and reviewed_by is null)
    or (status in ('approved', 'rejected') and reviewed_at is not null and reviewed_by is not null)
  ),
  check (
    (status = 'approved' and approved_property_id is not null)
    or (status <> 'approved' and approved_property_id is null)
  )
);

create index property_submissions_owner_created_idx
on public.property_submissions (owner_id, created_at desc);
create index property_submissions_org_status_idx
on public.property_submissions (organization_id, status, submitted_at desc);
create index property_submissions_reviewer_idx
on public.property_submissions (reviewed_by)
where reviewed_by is not null;
create index property_submissions_location_gix
on public.property_submissions using gist (location);

create trigger property_submissions_set_updated_at
before update on public.property_submissions
for each row execute function public.set_updated_at();

-- New public accounts receive a non-privileged profile. Organization roles are
-- granted only through the separate, email-bound staff invitation workflow.
create or replace function private.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_locale text;
begin
  requested_locale := coalesce(nullif(new.raw_user_meta_data ->> 'locale', ''), 'ku');
  if requested_locale not in ('en', 'ku', 'ar') then
    requested_locale := 'ku';
  end if;

  insert into public.profiles (user_id, full_name, phone, locale)
  values (
    new.id,
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1), 'Property owner'),
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'phone'), ''), new.phone, ''),
    requested_locale
  )
  on conflict (user_id) do update set
    full_name = case when public.profiles.full_name = '' then excluded.full_name else public.profiles.full_name end,
    phone = case when public.profiles.phone = '' then excluded.phone else public.profiles.phone end,
    locale = excluded.locale,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists auth_user_create_profile on auth.users;
create trigger auth_user_create_profile
after insert on auth.users
for each row execute function private.create_profile_for_new_user();

revoke execute on function private.create_profile_for_new_user() from public, anon, authenticated;

-- A leader changes only the decision fields. This trigger validates the state
-- transition and, on approval, creates the CRM seller and published property in
-- the same transaction. A failed publication rolls back the decision.
create or replace function private.review_property_submission()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  seller_contact_id uuid;
  published_property_id uuid;
  seller_email text;
  localized_title jsonb;
  localized_description jsonb;
begin
  if new.status = old.status then
    return new;
  end if;

  if not private.has_org_role(
    old.organization_id,
    array['owner', 'admin', 'manager']::public.organization_role[]
  ) then
    raise exception 'Only an organization leader can review submissions';
  end if;

  if old.status not in ('submitted', 'under_review')
     or new.status not in ('under_review', 'approved', 'rejected') then
    raise exception 'Invalid submission status transition';
  end if;

  if new.status = 'under_review' then
    new.reviewed_by := null;
    new.reviewed_at := null;
    new.approved_property_id := null;
    return new;
  end if;

  new.reviewed_by := actor_id;
  new.reviewed_at := now();

  if new.status = 'rejected' then
    if length(btrim(new.reviewer_notes)) < 3 then
      raise exception 'A rejection reason is required';
    end if;
    new.approved_property_id := null;
    return new;
  end if;

  select lower(coalesce(users.email, ''))
  into seller_email
  from auth.users users
  where users.id = old.owner_id;

  insert into public.contacts (
    organization_id,
    branch_id,
    portal_user_id,
    contact_type,
    first_name,
    email,
    phone,
    address,
    source,
    notes,
    created_by
  )
  values (
    old.organization_id,
    '00000000-0000-4000-8000-000000000002',
    old.owner_id,
    'seller',
    old.contact_name,
    coalesce(nullif(old.contact_email, ''), seller_email, ''),
    old.contact_phone,
    old.address,
    'portal',
    'Verified account submission ' || old.id::text,
    actor_id
  )
  on conflict (organization_id, portal_user_id) where portal_user_id is not null
  do update set
    first_name = excluded.first_name,
    email = excluded.email,
    phone = excluded.phone,
    address = excluded.address,
    contact_type = 'seller',
    source = 'portal',
    updated_at = now()
  returning id into seller_contact_id;

  localized_title := jsonb_build_object(
    'en', old.title,
    'ku', old.title,
    'ar', old.title
  );
  localized_description := jsonb_build_object(
    'en', old.description,
    'ku', old.description,
    'ar', old.description
  );

  insert into public.properties (
    organization_id,
    branch_id,
    owner_contact_id,
    title,
    description,
    property_type,
    status,
    price,
    currency,
    area_m2,
    address,
    latitude,
    longitude,
    image_url,
    gallery,
    payment_options,
    completion_percent,
    is_published,
    created_by,
    bedrooms,
    bathrooms,
    floors,
    parking_spaces,
    year_built,
    features,
    internal_notes
  )
  values (
    old.organization_id,
    '00000000-0000-4000-8000-000000000002',
    seller_contact_id,
    localized_title,
    localized_description,
    old.property_type,
    'available',
    old.price,
    old.currency,
    old.area_m2,
    old.address,
    old.latitude,
    old.longitude,
    old.image_urls[1],
    old.image_urls,
    old.payment_options,
    100,
    true,
    actor_id,
    old.bedrooms,
    old.bathrooms,
    old.floors,
    old.parking_spaces,
    old.year_built,
    jsonb_build_object('amenities', to_jsonb(old.features), 'source_locale', old.submission_locale),
    'Approved owner submission ' || old.id::text || case when new.reviewer_notes = '' then '' else E'\n' || new.reviewer_notes end
  )
  returning id into published_property_id;

  new.approved_property_id := published_property_id;
  return new;
end;
$$;

create trigger property_submissions_review
before update of status on public.property_submissions
for each row execute function private.review_property_submission();

revoke execute on function private.review_property_submission() from public, anon, authenticated;

alter table public.property_submissions enable row level security;

create policy "Owners read their property submissions"
on public.property_submissions for select to authenticated
using (owner_id = (select auth.uid()));

create policy "Staff read organization property submissions"
on public.property_submissions for select to authenticated
using (private.is_org_member(organization_id));

create policy "Owners create property submissions"
on public.property_submissions for insert to authenticated
with check (
  owner_id = (select auth.uid())
  and organization_id = '00000000-0000-4000-8000-000000000001'
  and status = 'submitted'
  and reviewed_by is null
  and reviewed_at is null
  and approved_property_id is null
);

create policy "Leaders review property submissions"
on public.property_submissions for update to authenticated
using (private.has_org_role(
  organization_id,
  array['owner', 'admin', 'manager']::public.organization_role[]
))
with check (private.has_org_role(
  organization_id,
  array['owner', 'admin', 'manager']::public.organization_role[]
));

create trigger property_submissions_audit
after insert or update or delete on public.property_submissions
for each row execute function private.capture_audit_log();

-- Explicit Data API grants: sellers may supply only listing inputs; review and
-- identity columns remain database-controlled.
revoke all on public.property_submissions from public, anon, authenticated;
grant select on public.property_submissions to authenticated;
grant insert (
  id,
  submission_locale,
  title,
  description,
  property_type,
  price,
  currency,
  area_m2,
  address,
  latitude,
  longitude,
  image_urls,
  payment_options,
  contact_name,
  contact_phone,
  contact_email,
  bedrooms,
  bathrooms,
  floors,
  parking_spaces,
  year_built,
  features
) on public.property_submissions to authenticated;
grant update (status, reviewer_notes) on public.property_submissions to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'property-submissions',
  'property-submissions',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Submission images are publicly readable"
on storage.objects for select to public
using (bucket_id = 'property-submissions');

create policy "Owners upload submission images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'property-submissions'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Owners update submission images"
on storage.objects for update to authenticated
using (
  bucket_id = 'property-submissions'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'property-submissions'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Owners delete submission images"
on storage.objects for delete to authenticated
using (
  bucket_id = 'property-submissions'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
