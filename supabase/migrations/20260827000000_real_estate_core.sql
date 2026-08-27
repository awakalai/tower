-- Tower Real Estate & Construction Management System
-- PostgreSQL/PostGIS schema, Data API grants, RLS, and Storage policies.

create extension if not exists postgis with schema extensions;

create type public.property_type as enum ('land', 'house', 'apartment');
create type public.property_status as enum ('available', 'reserved', 'sold', 'construction');
create type public.payment_method as enum ('cash', 'installment', 'advance');
create type public.expense_category as enum ('materials', 'labor', 'equipment', 'permits', 'operations', 'other');
create type public.receipt_status as enum ('issued', 'voided');

create sequence public.property_reference_seq start with 1001;
create sequence public.receipt_number_seq start with 1;

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  reference_code text not null unique default ('TWR-' || nextval('public.property_reference_seq')),
  title jsonb not null check (
    jsonb_typeof(title) = 'object'
    and title ?& array['en', 'ku', 'ar']
  ),
  description jsonb not null default '{"en":"","ku":"","ar":""}'::jsonb check (
    jsonb_typeof(description) = 'object'
    and description ?& array['en', 'ku', 'ar']
  ),
  property_type public.property_type not null,
  status public.property_status not null default 'available',
  price numeric(14, 2) not null check (price > 0),
  currency char(3) not null default 'USD',
  area_m2 numeric(12, 2) not null check (area_m2 > 0),
  address text not null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  location extensions.geography(Point, 4326)
    generated always as (
      extensions.st_setsrid(extensions.st_makepoint(longitude, latitude), 4326)::extensions.geography
    ) stored,
  image_url text not null,
  gallery text[] not null default '{}',
  payment_options public.payment_method[] not null default array['cash']::public.payment_method[],
  completion_percent smallint not null default 0 check (completion_percent between 0 and 100),
  is_published boolean not null default false,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties(id) on delete set null,
  category public.expense_category not null,
  amount numeric(14, 2) not null check (amount > 0),
  currency char(3) not null default 'USD',
  incurred_on date not null default current_date,
  vendor text not null,
  notes text not null default '',
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.receipts (
  id uuid primary key default gen_random_uuid(),
  receipt_number text not null unique default (
    'TWR-' || to_char(current_date, 'YYYY') || '-' || lpad(nextval('public.receipt_number_seq')::text, 6, '0')
  ),
  property_id uuid references public.properties(id) on delete set null,
  customer_name text not null,
  customer_phone text not null default '',
  customer_address text not null default '',
  payment_type public.payment_method not null,
  amount numeric(14, 2) not null check (amount > 0),
  contract_total numeric(14, 2) check (contract_total is null or contract_total > 0),
  balance_due numeric(14, 2) not null default 0 check (balance_due >= 0),
  currency char(3) not null default 'USD',
  payment_date date not null default current_date,
  next_due_date date,
  installment_number integer check (installment_number is null or installment_number > 0),
  notes text not null default '',
  authorized_by text not null,
  issued_by uuid references auth.users(id) on delete set null default auth.uid(),
  status public.receipt_status not null default 'issued',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index properties_location_gix on public.properties using gist (location);
create index properties_public_filter_idx on public.properties (is_published, property_type, status, price);
create index expenses_property_date_idx on public.expenses (property_id, incurred_on desc);
create index receipts_property_date_idx on public.receipts (property_id, payment_date desc);
create index receipts_customer_idx on public.receipts (lower(customer_name));

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger properties_set_updated_at before update on public.properties
for each row execute function public.set_updated_at();
create trigger expenses_set_updated_at before update on public.expenses
for each row execute function public.set_updated_at();
create trigger receipts_set_updated_at before update on public.receipts
for each row execute function public.set_updated_at();

alter table public.properties enable row level security;
alter table public.expenses enable row level security;
alter table public.receipts enable row level security;

-- Public users can only read explicitly published inventory.
create policy "Published properties are public"
on public.properties for select to anon
using (is_published = true);

-- Supabase Auth protects the operational workspace. Keep public sign-ups disabled
-- so only invited company staff receive authenticated accounts.
create policy "Authenticated staff read properties"
on public.properties for select to authenticated using (true);
create policy "Authenticated staff create properties"
on public.properties for insert to authenticated with check (true);
create policy "Authenticated staff update properties"
on public.properties for update to authenticated using (true) with check (true);
create policy "Authenticated staff delete properties"
on public.properties for delete to authenticated using (true);

create policy "Authenticated staff read expenses"
on public.expenses for select to authenticated using (true);
create policy "Authenticated staff create expenses"
on public.expenses for insert to authenticated with check (true);
create policy "Authenticated staff update expenses"
on public.expenses for update to authenticated using (true) with check (true);
create policy "Authenticated staff delete expenses"
on public.expenses for delete to authenticated using (true);

create policy "Authenticated staff read receipts"
on public.receipts for select to authenticated using (true);
create policy "Authenticated staff create receipts"
on public.receipts for insert to authenticated with check (true);
create policy "Authenticated staff update receipts"
on public.receipts for update to authenticated using (true) with check (true);
create policy "Authenticated staff delete receipts"
on public.receipts for delete to authenticated using (true);

-- Current Data API projects require explicit object privileges in addition to RLS.
grant usage on schema public to anon, authenticated;
grant select on public.properties to anon;
grant select, insert, update, delete on public.properties to authenticated;
grant select, insert, update, delete on public.expenses to authenticated;
grant select, insert, update, delete on public.receipts to authenticated;
grant usage, select on sequence public.property_reference_seq to authenticated;
grant usage, select on sequence public.receipt_number_seq to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'property-images',
  'property-images',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Property images are public"
on storage.objects for select to public
using (bucket_id = 'property-images');
create policy "Authenticated staff upload property images"
on storage.objects for insert to authenticated
with check (bucket_id = 'property-images');
create policy "Authenticated staff update property images"
on storage.objects for update to authenticated
using (bucket_id = 'property-images') with check (bucket_id = 'property-images');
create policy "Authenticated staff delete property images"
on storage.objects for delete to authenticated
using (bucket_id = 'property-images');
