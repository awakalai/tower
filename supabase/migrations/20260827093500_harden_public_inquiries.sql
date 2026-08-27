-- Route public lead capture through a narrow, validated RPC instead of exposing
-- direct table inserts to anonymous clients.

drop policy if exists "Public creates inquiries" on public.inquiries;
revoke insert on table public.inquiries from anon;

alter table public.inquiries
  add constraint inquiries_name_length_check
    check (char_length(btrim(name)) between 2 and 120),
  add constraint inquiries_phone_length_check
    check (char_length(btrim(phone)) between 5 and 40),
  add constraint inquiries_email_length_check
    check (char_length(email) <= 254),
  add constraint inquiries_message_length_check
    check (char_length(message) <= 2000);

create or replace function public.submit_property_inquiry(
  p_property_id uuid,
  p_name text,
  p_phone text,
  p_email text default '',
  p_message text default '',
  p_locale text default 'en'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_organization_id uuid;
  normalized_name text := btrim(coalesce(p_name, ''));
  normalized_phone text := btrim(coalesce(p_phone, ''));
  normalized_email text := lower(btrim(coalesce(p_email, '')));
  normalized_message text := btrim(coalesce(p_message, ''));
  inquiry_id uuid;
begin
  if char_length(normalized_name) not between 2 and 120 then
    raise exception 'A valid name is required' using errcode = '22023';
  end if;
  if char_length(normalized_phone) not between 5 and 40 then
    raise exception 'A valid phone number is required' using errcode = '22023';
  end if;
  if char_length(normalized_email) > 254
     or (normalized_email <> '' and normalized_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$') then
    raise exception 'A valid email address is required' using errcode = '22023';
  end if;
  if char_length(normalized_message) > 2000 then
    raise exception 'The message is too long' using errcode = '22023';
  end if;
  if p_locale not in ('en', 'ku', 'ar') then
    raise exception 'Unsupported locale' using errcode = '22023';
  end if;

  select property.organization_id
    into target_organization_id
  from public.properties property
  where property.id = p_property_id
    and property.is_published;

  if target_organization_id is null then
    raise exception 'Published property not found' using errcode = '22023';
  end if;

  -- Serialize identical submissions so concurrent requests cannot bypass the
  -- duplicate-request window.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_property_id::text || ':' || lower(normalized_phone), 0)
  );

  if exists (
    select 1
    from public.inquiries inquiry
    where inquiry.property_id = p_property_id
      and lower(btrim(inquiry.phone)) = lower(normalized_phone)
      and inquiry.created_at > now() - interval '10 minutes'
  ) then
    raise exception 'Please wait before sending another inquiry' using errcode = '22023';
  end if;

  insert into public.inquiries (
    organization_id,
    property_id,
    name,
    phone,
    email,
    message,
    locale,
    status,
    assigned_to
  )
  values (
    target_organization_id,
    p_property_id,
    normalized_name,
    normalized_phone,
    normalized_email,
    normalized_message,
    p_locale,
    'new',
    null
  )
  returning id into inquiry_id;

  return inquiry_id;
end;
$$;

revoke all on function public.submit_property_inquiry(uuid, text, text, text, text, text)
  from public;
grant execute on function public.submit_property_inquiry(uuid, text, text, text, text, text)
  to anon, authenticated;
