-- Replace the public SECURITY DEFINER RPC with column-level INSERT privileges
-- and a non-executable private trigger. Anonymous clients can provide only the
-- six lead-capture fields; organization, workflow status and ownership are
-- always derived by the database.

revoke all on function public.submit_property_inquiry(uuid, text, text, text, text, text)
  from public, anon, authenticated;
drop function public.submit_property_inquiry(uuid, text, text, text, text, text);

drop trigger if exists inquiries_set_organization on public.inquiries;
drop function if exists public.set_inquiry_organization();

create or replace function private.prepare_public_inquiry()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.name := btrim(coalesce(new.name, ''));
  new.phone := btrim(coalesce(new.phone, ''));
  new.email := lower(btrim(coalesce(new.email, '')));
  new.message := btrim(coalesce(new.message, ''));

  if char_length(new.name) not between 2 and 120 then
    raise exception 'A valid name is required' using errcode = '22023';
  end if;
  if char_length(new.phone) not between 5 and 40 then
    raise exception 'A valid phone number is required' using errcode = '22023';
  end if;
  if char_length(new.email) > 254
     or (new.email <> '' and new.email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$') then
    raise exception 'A valid email address is required' using errcode = '22023';
  end if;
  if char_length(new.message) > 2000 then
    raise exception 'The message is too long' using errcode = '22023';
  end if;
  if new.locale not in ('en', 'ku', 'ar') then
    raise exception 'Unsupported locale' using errcode = '22023';
  end if;

  select property.organization_id
    into new.organization_id
  from public.properties property
  where property.id = new.property_id
    and property.is_published;

  if new.organization_id is null then
    raise exception 'Published property not found' using errcode = '22023';
  end if;

  new.status := 'new';
  new.assigned_to := null;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(new.property_id::text || ':' || lower(new.phone), 0)
  );

  if exists (
    select 1
    from public.inquiries inquiry
    where inquiry.property_id = new.property_id
      and lower(btrim(inquiry.phone)) = lower(new.phone)
      and inquiry.created_at > now() - interval '10 minutes'
  ) then
    raise exception 'Please wait before sending another inquiry' using errcode = '22023';
  end if;

  return new;
end;
$$;

revoke all on function private.prepare_public_inquiry()
  from public, anon, authenticated;

create trigger inquiries_prepare_public_submission
before insert on public.inquiries
for each row execute function private.prepare_public_inquiry();

create policy "Public submits validated inquiries"
on public.inquiries for insert to anon, authenticated
with check (
  status = 'new'
  and assigned_to is null
  and exists (
    select 1
    from public.properties property
    where property.id = property_id
      and property.organization_id = organization_id
      and property.is_published
  )
);

grant insert (property_id, name, email, phone, message, locale)
on public.inquiries to anon, authenticated;

