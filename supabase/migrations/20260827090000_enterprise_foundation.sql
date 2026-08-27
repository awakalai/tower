-- Enterprise foundation for multi-company real-estate operations.
-- Preserves the existing inventory while adding tenant isolation, RBAC, CRM,
-- project delivery, contracts, installments, tasks, documents, inquiries, and audit history.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create type public.organization_role as enum (
  'owner',
  'admin',
  'manager',
  'sales_agent',
  'accountant',
  'project_manager',
  'viewer'
);
create type public.project_status as enum ('planning', 'active', 'on_hold', 'completed', 'cancelled');
create type public.contact_type as enum ('buyer', 'seller', 'tenant', 'landlord', 'investor', 'vendor', 'partner');
create type public.lead_status as enum ('new', 'contacted', 'qualified', 'viewing', 'negotiation', 'won', 'lost');
create type public.lead_source as enum ('website', 'referral', 'social', 'walk_in', 'campaign', 'portal', 'other');
create type public.deal_status as enum ('draft', 'reserved', 'contracted', 'completed', 'cancelled');
create type public.installment_status as enum ('pending', 'partial', 'paid', 'overdue', 'waived');
create type public.task_status as enum ('open', 'in_progress', 'completed', 'cancelled');
create type public.priority_level as enum ('low', 'normal', 'high', 'urgent');
create type public.inquiry_status as enum ('new', 'contacted', 'converted', 'closed');

create sequence public.contract_number_seq start with 1;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text not null default '',
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  default_currency char(3) not null default 'USD',
  timezone text not null default 'Asia/Baghdad',
  phone text not null default '',
  email text not null default '',
  address text not null default '',
  logo_url text,
  tax_number text not null default '',
  registration_number text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.branches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  code text not null,
  phone text not null default '',
  email text not null default '',
  address text not null default '',
  latitude double precision check (latitude is null or latitude between -90 and 90),
  longitude double precision check (longitude is null or longitude between -180 and 180),
  location extensions.geography(Point, 4326)
    generated always as (
      case
        when latitude is null or longitude is null then null
        else extensions.st_setsrid(extensions.st_makepoint(longitude, latitude), 4326)::extensions.geography
      end
    ) stored,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, code)
);

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text not null default '',
  avatar_url text,
  locale text not null default 'en' check (locale in ('en', 'ku', 'ar')),
  job_title text not null default '',
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  role public.organization_role not null default 'viewer',
  is_active boolean not null default true,
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create or replace function private.is_org_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.organization_members membership
      where membership.organization_id = target_organization_id
        and membership.user_id = (select auth.uid())
        and membership.is_active
    );
$$;

create or replace function private.has_org_role(
  target_organization_id uuid,
  allowed_roles public.organization_role[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.organization_members membership
      where membership.organization_id = target_organization_id
        and membership.user_id = (select auth.uid())
        and membership.is_active
        and membership.role = any(allowed_roles)
    );
$$;

create or replace function private.shares_org(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.organization_members mine
      join public.organization_members theirs
        on theirs.organization_id = mine.organization_id
       and theirs.is_active
      where mine.user_id = (select auth.uid())
        and mine.is_active
        and theirs.user_id = target_user_id
    );
$$;

create or replace function private.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select membership.organization_id
  from public.organization_members membership
  where membership.user_id = (select auth.uid())
    and membership.is_active
  order by membership.joined_at
  limit 1;
$$;

create or replace function private.safe_uuid(candidate text)
returns uuid
language plpgsql
immutable
strict
set search_path = ''
as $$
begin
  return candidate::uuid;
exception
  when invalid_text_representation then
    return null;
end;
$$;

revoke execute on function private.is_org_member(uuid) from public;
revoke execute on function private.has_org_role(uuid, public.organization_role[]) from public;
revoke execute on function private.shares_org(uuid) from public;
revoke execute on function private.current_org_id() from public;
grant execute on function private.is_org_member(uuid) to authenticated;
grant execute on function private.has_org_role(uuid, public.organization_role[]) to authenticated;
grant execute on function private.shares_org(uuid) to authenticated;
grant execute on function private.current_org_id() to authenticated;
grant execute on function private.safe_uuid(text) to authenticated;

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null default private.current_org_id()
    references public.organizations(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  name text not null,
  code text not null,
  description text not null default '',
  status public.project_status not null default 'planning',
  start_date date,
  target_completion date,
  completed_on date,
  budget numeric(16, 2) not null default 0 check (budget >= 0),
  currency char(3) not null default 'USD',
  completion_percent smallint not null default 0 check (completion_percent between 0 and 100),
  address text not null default '',
  latitude double precision check (latitude is null or latitude between -90 and 90),
  longitude double precision check (longitude is null or longitude between -180 and 180),
  location extensions.geography(Point, 4326)
    generated always as (
      case
        when latitude is null or longitude is null then null
        else extensions.st_setsrid(extensions.st_makepoint(longitude, latitude), 4326)::extensions.geography
      end
    ) stored,
  manager_id uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, code)
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null default private.current_org_id()
    references public.organizations(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  contact_type public.contact_type not null default 'buyer',
  first_name text not null,
  last_name text not null default '',
  company_name text not null default '',
  email text not null default '',
  phone text not null default '',
  alternate_phone text not null default '',
  address text not null default '',
  nationality text not null default '',
  source public.lead_source not null default 'other',
  assigned_to uuid references auth.users(id) on delete set null,
  notes text not null default '',
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.properties
  add column organization_id uuid references public.organizations(id) on delete cascade,
  add column branch_id uuid references public.branches(id) on delete set null,
  add column project_id uuid references public.projects(id) on delete set null,
  add column owner_contact_id uuid references public.contacts(id) on delete set null,
  add column bedrooms smallint check (bedrooms is null or bedrooms >= 0),
  add column bathrooms smallint check (bathrooms is null or bathrooms >= 0),
  add column floors smallint check (floors is null or floors >= 0),
  add column parking_spaces smallint check (parking_spaces is null or parking_spaces >= 0),
  add column year_built smallint check (year_built is null or year_built between 1800 and 2200),
  add column features jsonb not null default '{}'::jsonb check (jsonb_typeof(features) = 'object'),
  add column internal_notes text not null default '';

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null default private.current_org_id()
    references public.organizations(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  assigned_to uuid references auth.users(id) on delete set null,
  status public.lead_status not null default 'new',
  source public.lead_source not null default 'other',
  priority public.priority_level not null default 'normal',
  budget_min numeric(16, 2) check (budget_min is null or budget_min >= 0),
  budget_max numeric(16, 2) check (budget_max is null or budget_max >= 0),
  currency char(3) not null default 'USD',
  desired_property_types public.property_type[] not null default '{}',
  next_follow_up_at timestamptz,
  lost_reason text not null default '',
  notes text not null default '',
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (budget_min is null or budget_max is null or budget_max >= budget_min)
);

create table public.deals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null default private.current_org_id()
    references public.organizations(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  contract_number text not null default (
    'CTR-' || to_char(current_date, 'YYYY') || '-' ||
    lpad(nextval('public.contract_number_seq')::text, 6, '0')
  ),
  lead_id uuid references public.leads(id) on delete set null,
  contact_id uuid not null references public.contacts(id) on delete restrict,
  property_id uuid references public.properties(id) on delete restrict,
  project_id uuid references public.projects(id) on delete set null,
  assigned_to uuid references auth.users(id) on delete set null,
  status public.deal_status not null default 'draft',
  payment_method public.payment_method not null default 'cash',
  total_value numeric(16, 2) not null check (total_value > 0),
  down_payment numeric(16, 2) not null default 0 check (down_payment >= 0),
  discount numeric(16, 2) not null default 0 check (discount >= 0),
  currency char(3) not null default 'USD',
  expected_close_date date,
  signed_on date,
  closed_at timestamptz,
  notes text not null default '',
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, contract_number),
  check (down_payment + discount <= total_value)
);

alter table public.expenses
  add column organization_id uuid references public.organizations(id) on delete cascade,
  add column branch_id uuid references public.branches(id) on delete set null,
  add column project_id uuid references public.projects(id) on delete set null,
  add column approved_by uuid references auth.users(id) on delete set null,
  add column attachment_url text;

alter table public.receipts
  add column organization_id uuid references public.organizations(id) on delete cascade,
  add column branch_id uuid references public.branches(id) on delete set null,
  add column contact_id uuid references public.contacts(id) on delete set null,
  add column deal_id uuid references public.deals(id) on delete set null;

create table public.installments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null default private.current_org_id()
    references public.organizations(id) on delete cascade,
  deal_id uuid not null references public.deals(id) on delete cascade,
  sequence_number integer not null check (sequence_number > 0),
  due_date date not null,
  amount numeric(16, 2) not null check (amount > 0),
  paid_amount numeric(16, 2) not null default 0 check (paid_amount >= 0 and paid_amount <= amount),
  currency char(3) not null default 'USD',
  status public.installment_status not null default 'pending',
  paid_at timestamptz,
  receipt_id uuid references public.receipts(id) on delete set null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (deal_id, sequence_number)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null default private.current_org_id()
    references public.organizations(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  title text not null,
  description text not null default '',
  status public.task_status not null default 'open',
  priority public.priority_level not null default 'normal',
  due_at timestamptz,
  assigned_to uuid references auth.users(id) on delete set null,
  lead_id uuid references public.leads(id) on delete cascade,
  deal_id uuid references public.deals(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  property_id uuid references public.properties(id) on delete cascade,
  completed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null default private.current_org_id()
    references public.organizations(id) on delete cascade,
  entity_type text not null check (entity_type in ('property', 'project', 'contact', 'lead', 'deal', 'expense', 'receipt')),
  entity_id uuid not null,
  name text not null,
  storage_path text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  uploaded_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  unique (organization_id, storage_path)
);

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  name text not null,
  email text not null default '',
  phone text not null default '',
  message text not null default '',
  locale text not null default 'en' check (locale in ('en', 'ku', 'ar')),
  status public.inquiry_status not null default 'new',
  assigned_to uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  entity_type text not null,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz not null default now()
);

insert into public.organizations (
  id, name, legal_name, slug, phone, email, address
)
values (
  '00000000-0000-4000-8000-000000000001',
  'TOWER Real Estate Group',
  'TOWER Real Estate & Construction',
  'tower-real-estate',
  '+964 750 000 0000',
  'info@tower.properties',
  'Erbil, Kurdistan Region, Iraq'
)
on conflict (id) do nothing;

insert into public.branches (
  id, organization_id, name, code, address, latitude, longitude
)
values (
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000001',
  'Erbil Headquarters',
  'ERB-HQ',
  'Erbil, Kurdistan Region, Iraq',
  36.2058,
  44.0073
)
on conflict (id) do nothing;

insert into public.profiles (user_id, full_name, locale)
select
  users.id,
  coalesce(nullif(users.raw_user_meta_data ->> 'full_name', ''), split_part(users.email, '@', 1), 'Team member'),
  'en'
from auth.users users
on conflict (user_id) do nothing;

with ranked_users as (
  select users.id, row_number() over (order by users.created_at, users.id) as position
  from auth.users users
)
insert into public.organization_members (
  organization_id, user_id, branch_id, role
)
select
  '00000000-0000-4000-8000-000000000001',
  ranked_users.id,
  '00000000-0000-4000-8000-000000000002',
  case when ranked_users.position = 1 then 'owner'::public.organization_role else 'viewer'::public.organization_role end
from ranked_users
on conflict (organization_id, user_id) do nothing;

update public.properties
set
  organization_id = '00000000-0000-4000-8000-000000000001',
  branch_id = '00000000-0000-4000-8000-000000000002'
where organization_id is null;

update public.expenses
set
  organization_id = '00000000-0000-4000-8000-000000000001',
  branch_id = '00000000-0000-4000-8000-000000000002'
where organization_id is null;

update public.receipts
set
  organization_id = '00000000-0000-4000-8000-000000000001',
  branch_id = '00000000-0000-4000-8000-000000000002'
where organization_id is null;

alter table public.properties
  alter column organization_id set not null,
  alter column organization_id set default private.current_org_id();
alter table public.expenses
  alter column organization_id set not null,
  alter column organization_id set default private.current_org_id();
alter table public.receipts
  alter column organization_id set not null,
  alter column organization_id set default private.current_org_id();

insert into public.projects (
  id, organization_id, branch_id, name, code, description, status,
  start_date, target_completion, budget, completion_percent, address, latitude, longitude
)
values
  (
    '00000000-0000-4000-8000-000000000101',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000002',
    'Empire Residences',
    'PRJ-EMPIRE',
    'Premium residential portfolio and serviced apartment development.',
    'active',
    current_date - 240,
    current_date + 310,
    12500000,
    62,
    'Empire World, Erbil',
    36.2189,
    44.0301
  ),
  (
    '00000000-0000-4000-8000-000000000102',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000002',
    'Gulan Urban Living',
    'PRJ-GULAN',
    'Modern urban apartments with phased construction delivery.',
    'active',
    current_date - 120,
    current_date + 420,
    8600000,
    38,
    'Gulan Street, Erbil',
    36.2068,
    44.0218
  )
on conflict (id) do nothing;

update public.properties
set project_id = case
  when id in (
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222',
    '33333333-3333-4333-8333-333333333333'
  ) then '00000000-0000-4000-8000-000000000101'::uuid
  else '00000000-0000-4000-8000-000000000102'::uuid
end
where organization_id = '00000000-0000-4000-8000-000000000001';

insert into public.contacts (
  id, organization_id, branch_id, contact_type, first_name, last_name,
  company_name, email, phone, source, notes
)
values
  (
    '00000000-0000-4000-8000-000000000201',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000002',
    'buyer', 'Aso', 'Karim', '', 'aso.karim@example.com', '+964 750 123 4501',
    'website', 'Interested in premium family homes in Ankawa.'
  ),
  (
    '00000000-0000-4000-8000-000000000202',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000002',
    'investor', 'Lana', 'Ahmed', 'Horizon Investments', 'lana@horizon.example',
    '+964 751 765 4402', 'referral', 'Portfolio investor focused on rental yield.'
  ),
  (
    '00000000-0000-4000-8000-000000000203',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000002',
    'buyer', 'Dana', 'Rashid', '', 'dana.rashid@example.com', '+964 770 620 8803',
    'walk_in', 'Looking for an installment-ready apartment.'
  )
on conflict (id) do nothing;

insert into public.leads (
  id, organization_id, branch_id, contact_id, property_id, project_id,
  status, source, priority, budget_min, budget_max, next_follow_up_at, notes
)
values
  (
    '00000000-0000-4000-8000-000000000301',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000201',
    '11111111-1111-4111-8111-111111111111',
    '00000000-0000-4000-8000-000000000101',
    'viewing', 'website', 'high', 320000, 420000, now() + interval '1 day',
    'Private viewing scheduled with the family.'
  ),
  (
    '00000000-0000-4000-8000-000000000302',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000202',
    '22222222-2222-4222-8222-222222222222',
    '00000000-0000-4000-8000-000000000101',
    'negotiation', 'referral', 'urgent', 150000, 650000, now() + interval '4 hours',
    'Reviewing two-unit investment terms.'
  ),
  (
    '00000000-0000-4000-8000-000000000303',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000203',
    '55555555-5555-4555-8555-555555555555',
    '00000000-0000-4000-8000-000000000102',
    'qualified', 'walk_in', 'normal', 110000, 170000, now() + interval '3 days',
    'Prefers a 24-month installment plan.'
  )
on conflict (id) do nothing;

insert into public.deals (
  id, organization_id, branch_id, lead_id, contact_id, property_id, project_id,
  status, payment_method, total_value, down_payment, expected_close_date, signed_on, notes
)
values
  (
    '00000000-0000-4000-8000-000000000401',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000302',
    '00000000-0000-4000-8000-000000000202',
    '22222222-2222-4222-8222-222222222222',
    '00000000-0000-4000-8000-000000000101',
    'contracted', 'installment', 198000, 40000, current_date + 20, current_date - 10,
    'Corporate investment purchase with quarterly installments.'
  ),
  (
    '00000000-0000-4000-8000-000000000402',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000303',
    '00000000-0000-4000-8000-000000000203',
    '55555555-5555-4555-8555-555555555555',
    '00000000-0000-4000-8000-000000000102',
    'reserved', 'advance', 142000, 20000, current_date + 14, null,
    'Reservation pending final contract review.'
  )
on conflict (id) do nothing;

insert into public.installments (
  id, organization_id, deal_id, sequence_number, due_date, amount, paid_amount, status
)
values
  (
    '00000000-0000-4000-8000-000000000501',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000401',
    1, current_date - 30, 39500, 39500, 'paid'
  ),
  (
    '00000000-0000-4000-8000-000000000502',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000401',
    2, current_date + 30, 39500, 0, 'pending'
  ),
  (
    '00000000-0000-4000-8000-000000000503',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000401',
    3, current_date + 120, 39500, 0, 'pending'
  ),
  (
    '00000000-0000-4000-8000-000000000504',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000401',
    4, current_date + 210, 39500, 0, 'pending'
  ),
  (
    '00000000-0000-4000-8000-000000000505',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000402',
    1, current_date + 14, 61000, 0, 'pending'
  ),
  (
    '00000000-0000-4000-8000-000000000506',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000402',
    2, current_date + 104, 61000, 0, 'pending'
  )
on conflict (id) do nothing;

insert into public.tasks (
  id, organization_id, branch_id, title, description, priority, due_at, lead_id, deal_id, project_id
)
values
  (
    '00000000-0000-4000-8000-000000000601',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000002',
    'Prepare Ankawa villa viewing',
    'Confirm access, presentation materials, and client transport.',
    'high', now() + interval '1 day',
    '00000000-0000-4000-8000-000000000301', null,
    '00000000-0000-4000-8000-000000000101'
  ),
  (
    '00000000-0000-4000-8000-000000000602',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000002',
    'Review investment contract',
    'Complete legal and finance review before countersignature.',
    'urgent', now() + interval '4 hours',
    null, '00000000-0000-4000-8000-000000000401',
    '00000000-0000-4000-8000-000000000101'
  ),
  (
    '00000000-0000-4000-8000-000000000603',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000002',
    'Gulan construction review',
    'Update completion percentage and upload the weekly site report.',
    'normal', now() + interval '2 days',
    null, null, '00000000-0000-4000-8000-000000000102'
  )
on conflict (id) do nothing;

create or replace function private.sync_installment_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.paid_amount >= new.amount then
    new.status := 'paid';
    new.paid_at := coalesce(new.paid_at, now());
  elsif new.paid_amount > 0 then
    new.status := 'partial';
  elsif new.due_date < current_date and new.status not in ('waived', 'paid') then
    new.status := 'overdue';
  end if;
  return new;
end;
$$;

create trigger installments_sync_status
before insert or update of amount, paid_amount, due_date, status
on public.installments
for each row execute function private.sync_installment_status();

create or replace function public.set_inquiry_organization()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  select property.organization_id
    into new.organization_id
  from public.properties property
  where property.id = new.property_id
    and property.is_published;

  if new.organization_id is null then
    raise exception 'Published property not found';
  end if;

  return new;
end;
$$;
revoke execute on function public.set_inquiry_organization() from public, anon, authenticated;

create trigger inquiries_set_organization
before insert on public.inquiries
for each row execute function public.set_inquiry_organization();

create or replace function private.prevent_last_owner_removal()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  other_owners integer;
begin
  if old.role = 'owner' and old.is_active
     and (
       tg_op = 'DELETE'
       or new.role <> 'owner'
       or not new.is_active
     ) then
    select count(*)
      into other_owners
    from public.organization_members membership
    where membership.organization_id = old.organization_id
      and membership.user_id <> old.user_id
      and membership.role = 'owner'
      and membership.is_active;

    if other_owners = 0 then
      raise exception 'An organization must retain at least one active owner';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger organization_members_keep_owner
before update or delete on public.organization_members
for each row execute function private.prevent_last_owner_removal();

create or replace function private.capture_audit_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_row jsonb;
  new_row jsonb;
  target_organization_id uuid;
  target_id uuid;
begin
  if tg_op <> 'INSERT' then
    old_row := to_jsonb(old);
  end if;
  if tg_op <> 'DELETE' then
    new_row := to_jsonb(new);
  end if;

  target_organization_id := coalesce(
    nullif(new_row ->> 'organization_id', '')::uuid,
    nullif(old_row ->> 'organization_id', '')::uuid
  );
  target_id := coalesce(
    nullif(new_row ->> 'id', '')::uuid,
    nullif(old_row ->> 'id', '')::uuid
  );

  insert into public.audit_logs (
    organization_id, actor_id, action, entity_type, entity_id, old_values, new_values
  )
  values (
    target_organization_id,
    (select auth.uid()),
    tg_op,
    tg_table_name,
    target_id,
    old_row,
    new_row
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

do $$
declare
  audited_table text;
begin
  foreach audited_table in array array[
    'properties', 'projects', 'contacts', 'leads', 'deals', 'installments',
    'expenses', 'receipts', 'tasks', 'documents', 'inquiries'
  ]
  loop
    execute format(
      'create trigger %I_audit after insert or update or delete on public.%I for each row execute function private.capture_audit_log()',
      audited_table,
      audited_table
    );
  end loop;
end
$$;

create trigger organizations_set_updated_at before update on public.organizations
for each row execute function public.set_updated_at();
create trigger branches_set_updated_at before update on public.branches
for each row execute function public.set_updated_at();
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger organization_members_set_updated_at before update on public.organization_members
for each row execute function public.set_updated_at();
create trigger projects_set_updated_at before update on public.projects
for each row execute function public.set_updated_at();
create trigger contacts_set_updated_at before update on public.contacts
for each row execute function public.set_updated_at();
create trigger leads_set_updated_at before update on public.leads
for each row execute function public.set_updated_at();
create trigger deals_set_updated_at before update on public.deals
for each row execute function public.set_updated_at();
create trigger installments_set_updated_at before update on public.installments
for each row execute function public.set_updated_at();
create trigger tasks_set_updated_at before update on public.tasks
for each row execute function public.set_updated_at();
create trigger inquiries_set_updated_at before update on public.inquiries
for each row execute function public.set_updated_at();

create index branches_organization_idx on public.branches (organization_id);
create index branches_location_gix on public.branches using gist (location) where location is not null;
create index organization_members_user_idx on public.organization_members (user_id) where is_active;
create index organization_members_branch_idx on public.organization_members (branch_id);
create index projects_organization_status_idx on public.projects (organization_id, status);
create index projects_branch_idx on public.projects (branch_id);
create index projects_location_gix on public.projects using gist (location) where location is not null;
create index projects_manager_idx on public.projects (manager_id);
create index contacts_organization_name_idx on public.contacts (organization_id, lower(first_name), lower(last_name));
create index contacts_branch_idx on public.contacts (branch_id);
create index contacts_assigned_to_idx on public.contacts (assigned_to);
create index contacts_phone_idx on public.contacts (organization_id, phone);
create index properties_organization_idx on public.properties (organization_id);
create index properties_branch_idx on public.properties (branch_id);
create index properties_project_idx on public.properties (project_id);
create index properties_owner_contact_idx on public.properties (owner_contact_id);
create index leads_pipeline_idx on public.leads (organization_id, status, priority, created_at desc);
create index leads_branch_idx on public.leads (branch_id);
create index leads_contact_idx on public.leads (contact_id);
create index leads_property_idx on public.leads (property_id);
create index leads_project_idx on public.leads (project_id);
create index leads_assigned_to_idx on public.leads (assigned_to);
create index leads_follow_up_idx on public.leads (organization_id, next_follow_up_at) where status not in ('won', 'lost');
create index deals_pipeline_idx on public.deals (organization_id, status, expected_close_date);
create index deals_branch_idx on public.deals (branch_id);
create index deals_lead_idx on public.deals (lead_id);
create index deals_contact_idx on public.deals (contact_id);
create index deals_property_idx on public.deals (property_id);
create index deals_project_idx on public.deals (project_id);
create index deals_assigned_to_idx on public.deals (assigned_to);
create index expenses_organization_date_idx on public.expenses (organization_id, incurred_on desc);
create index expenses_branch_idx on public.expenses (branch_id);
create index expenses_project_idx on public.expenses (project_id);
create index expenses_approved_by_idx on public.expenses (approved_by);
create index receipts_organization_date_idx on public.receipts (organization_id, payment_date desc);
create index receipts_branch_idx on public.receipts (branch_id);
create index receipts_contact_idx on public.receipts (contact_id);
create index receipts_deal_idx on public.receipts (deal_id);
create index installments_org_due_idx on public.installments (organization_id, status, due_date);
create index installments_deal_idx on public.installments (deal_id);
create index installments_receipt_idx on public.installments (receipt_id);
create index tasks_org_status_due_idx on public.tasks (organization_id, status, due_at);
create index tasks_branch_idx on public.tasks (branch_id);
create index tasks_assigned_to_idx on public.tasks (assigned_to);
create index tasks_lead_idx on public.tasks (lead_id);
create index tasks_deal_idx on public.tasks (deal_id);
create index tasks_project_idx on public.tasks (project_id);
create index tasks_property_idx on public.tasks (property_id);
create index documents_org_entity_idx on public.documents (organization_id, entity_type, entity_id);
create index documents_uploaded_by_idx on public.documents (uploaded_by);
create index inquiries_org_status_idx on public.inquiries (organization_id, status, created_at desc);
create index inquiries_property_idx on public.inquiries (property_id);
create index inquiries_assigned_to_idx on public.inquiries (assigned_to);
create index audit_logs_org_created_idx on public.audit_logs (organization_id, created_at desc);
create index audit_logs_actor_idx on public.audit_logs (actor_id);
create index audit_logs_entity_idx on public.audit_logs (organization_id, entity_type, entity_id);

alter table public.organizations enable row level security;
alter table public.branches enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_members enable row level security;
alter table public.projects enable row level security;
alter table public.contacts enable row level security;
alter table public.leads enable row level security;
alter table public.deals enable row level security;
alter table public.installments enable row level security;
alter table public.tasks enable row level security;
alter table public.documents enable row level security;
alter table public.inquiries enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "Authenticated staff read properties" on public.properties;
drop policy if exists "Authenticated staff create properties" on public.properties;
drop policy if exists "Authenticated staff update properties" on public.properties;
drop policy if exists "Authenticated staff delete properties" on public.properties;
drop policy if exists "Authenticated staff read expenses" on public.expenses;
drop policy if exists "Authenticated staff create expenses" on public.expenses;
drop policy if exists "Authenticated staff update expenses" on public.expenses;
drop policy if exists "Authenticated staff delete expenses" on public.expenses;
drop policy if exists "Authenticated staff read receipts" on public.receipts;
drop policy if exists "Authenticated staff create receipts" on public.receipts;
drop policy if exists "Authenticated staff update receipts" on public.receipts;
drop policy if exists "Authenticated staff delete receipts" on public.receipts;

create policy "Members read organizations"
on public.organizations for select to authenticated
using (private.is_org_member(id));
create policy "Owners manage organizations"
on public.organizations for update to authenticated
using (private.has_org_role(id, array['owner', 'admin']::public.organization_role[]))
with check (private.has_org_role(id, array['owner', 'admin']::public.organization_role[]));

create policy "Members read branches"
on public.branches for select to authenticated
using (private.is_org_member(organization_id));
create policy "Leaders create branches"
on public.branches for insert to authenticated
with check (private.has_org_role(organization_id, array['owner', 'admin', 'manager']::public.organization_role[]));
create policy "Leaders update branches"
on public.branches for update to authenticated
using (private.has_org_role(organization_id, array['owner', 'admin', 'manager']::public.organization_role[]))
with check (private.has_org_role(organization_id, array['owner', 'admin', 'manager']::public.organization_role[]));
create policy "Owners delete branches"
on public.branches for delete to authenticated
using (private.has_org_role(organization_id, array['owner', 'admin']::public.organization_role[]));

create policy "Users read their shared profiles"
on public.profiles for select to authenticated
using (user_id = (select auth.uid()) or private.shares_org(user_id));
create policy "Users update their profile"
on public.profiles for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Members read organization memberships"
on public.organization_members for select to authenticated
using (private.is_org_member(organization_id));
create policy "Owners create organization memberships"
on public.organization_members for insert to authenticated
with check (private.has_org_role(organization_id, array['owner', 'admin']::public.organization_role[]));
create policy "Owners update organization memberships"
on public.organization_members for update to authenticated
using (private.has_org_role(organization_id, array['owner', 'admin']::public.organization_role[]))
with check (private.has_org_role(organization_id, array['owner', 'admin']::public.organization_role[]));
create policy "Owners delete organization memberships"
on public.organization_members for delete to authenticated
using (private.has_org_role(organization_id, array['owner', 'admin']::public.organization_role[]));

create policy "Published properties remain public"
on public.properties for select to authenticated
using (is_published or private.is_org_member(organization_id));
create policy "Property team creates inventory"
on public.properties for insert to authenticated
with check (private.has_org_role(
  organization_id,
  array['owner', 'admin', 'manager', 'sales_agent', 'project_manager']::public.organization_role[]
));
create policy "Property team updates inventory"
on public.properties for update to authenticated
using (private.has_org_role(
  organization_id,
  array['owner', 'admin', 'manager', 'sales_agent', 'project_manager']::public.organization_role[]
))
with check (private.has_org_role(
  organization_id,
  array['owner', 'admin', 'manager', 'sales_agent', 'project_manager']::public.organization_role[]
));
create policy "Leaders delete inventory"
on public.properties for delete to authenticated
using (private.has_org_role(organization_id, array['owner', 'admin', 'manager']::public.organization_role[]));

create policy "Members read projects"
on public.projects for select to authenticated using (private.is_org_member(organization_id));
create policy "Project team creates projects"
on public.projects for insert to authenticated
with check (private.has_org_role(organization_id, array['owner', 'admin', 'manager', 'project_manager']::public.organization_role[]));
create policy "Project team updates projects"
on public.projects for update to authenticated
using (private.has_org_role(organization_id, array['owner', 'admin', 'manager', 'project_manager']::public.organization_role[]))
with check (private.has_org_role(organization_id, array['owner', 'admin', 'manager', 'project_manager']::public.organization_role[]));
create policy "Leaders delete projects"
on public.projects for delete to authenticated
using (private.has_org_role(organization_id, array['owner', 'admin']::public.organization_role[]));

create policy "Members read contacts"
on public.contacts for select to authenticated using (private.is_org_member(organization_id));
create policy "Sales team creates contacts"
on public.contacts for insert to authenticated
with check (private.has_org_role(organization_id, array['owner', 'admin', 'manager', 'sales_agent']::public.organization_role[]));
create policy "Sales team updates contacts"
on public.contacts for update to authenticated
using (private.has_org_role(organization_id, array['owner', 'admin', 'manager', 'sales_agent']::public.organization_role[]))
with check (private.has_org_role(organization_id, array['owner', 'admin', 'manager', 'sales_agent']::public.organization_role[]));
create policy "Leaders delete contacts"
on public.contacts for delete to authenticated
using (private.has_org_role(organization_id, array['owner', 'admin', 'manager']::public.organization_role[]));

create policy "Members read leads"
on public.leads for select to authenticated using (private.is_org_member(organization_id));
create policy "Sales team creates leads"
on public.leads for insert to authenticated
with check (private.has_org_role(organization_id, array['owner', 'admin', 'manager', 'sales_agent']::public.organization_role[]));
create policy "Sales team updates leads"
on public.leads for update to authenticated
using (private.has_org_role(organization_id, array['owner', 'admin', 'manager', 'sales_agent']::public.organization_role[]))
with check (private.has_org_role(organization_id, array['owner', 'admin', 'manager', 'sales_agent']::public.organization_role[]));
create policy "Leaders delete leads"
on public.leads for delete to authenticated
using (private.has_org_role(organization_id, array['owner', 'admin', 'manager']::public.organization_role[]));

create policy "Members read deals"
on public.deals for select to authenticated using (private.is_org_member(organization_id));
create policy "Revenue team creates deals"
on public.deals for insert to authenticated
with check (private.has_org_role(organization_id, array['owner', 'admin', 'manager', 'sales_agent', 'accountant']::public.organization_role[]));
create policy "Revenue team updates deals"
on public.deals for update to authenticated
using (private.has_org_role(organization_id, array['owner', 'admin', 'manager', 'sales_agent', 'accountant']::public.organization_role[]))
with check (private.has_org_role(organization_id, array['owner', 'admin', 'manager', 'sales_agent', 'accountant']::public.organization_role[]));
create policy "Leaders delete deals"
on public.deals for delete to authenticated
using (private.has_org_role(organization_id, array['owner', 'admin']::public.organization_role[]));

create policy "Members read installments"
on public.installments for select to authenticated using (private.is_org_member(organization_id));
create policy "Finance creates installments"
on public.installments for insert to authenticated
with check (private.has_org_role(organization_id, array['owner', 'admin', 'manager', 'accountant']::public.organization_role[]));
create policy "Finance updates installments"
on public.installments for update to authenticated
using (private.has_org_role(organization_id, array['owner', 'admin', 'manager', 'accountant']::public.organization_role[]))
with check (private.has_org_role(organization_id, array['owner', 'admin', 'manager', 'accountant']::public.organization_role[]));
create policy "Finance deletes installments"
on public.installments for delete to authenticated
using (private.has_org_role(organization_id, array['owner', 'admin']::public.organization_role[]));

create policy "Members read expenses"
on public.expenses for select to authenticated using (private.is_org_member(organization_id));
create policy "Finance creates expenses"
on public.expenses for insert to authenticated
with check (private.has_org_role(organization_id, array['owner', 'admin', 'manager', 'accountant', 'project_manager']::public.organization_role[]));
create policy "Finance updates expenses"
on public.expenses for update to authenticated
using (private.has_org_role(organization_id, array['owner', 'admin', 'manager', 'accountant', 'project_manager']::public.organization_role[]))
with check (private.has_org_role(organization_id, array['owner', 'admin', 'manager', 'accountant', 'project_manager']::public.organization_role[]));
create policy "Leaders delete expenses"
on public.expenses for delete to authenticated
using (private.has_org_role(organization_id, array['owner', 'admin', 'manager', 'accountant']::public.organization_role[]));

create policy "Members read receipts"
on public.receipts for select to authenticated using (private.is_org_member(organization_id));
create policy "Finance creates receipts"
on public.receipts for insert to authenticated
with check (private.has_org_role(organization_id, array['owner', 'admin', 'manager', 'accountant']::public.organization_role[]));
create policy "Finance updates receipts"
on public.receipts for update to authenticated
using (private.has_org_role(organization_id, array['owner', 'admin', 'manager', 'accountant']::public.organization_role[]))
with check (private.has_org_role(organization_id, array['owner', 'admin', 'manager', 'accountant']::public.organization_role[]));
create policy "Finance deletes receipts"
on public.receipts for delete to authenticated
using (private.has_org_role(organization_id, array['owner', 'admin']::public.organization_role[]));

create policy "Members read tasks"
on public.tasks for select to authenticated using (private.is_org_member(organization_id));
create policy "Operational team creates tasks"
on public.tasks for insert to authenticated
with check (private.has_org_role(organization_id, array['owner', 'admin', 'manager', 'sales_agent', 'accountant', 'project_manager']::public.organization_role[]));
create policy "Operational team updates tasks"
on public.tasks for update to authenticated
using (private.has_org_role(organization_id, array['owner', 'admin', 'manager', 'sales_agent', 'accountant', 'project_manager']::public.organization_role[]))
with check (private.has_org_role(organization_id, array['owner', 'admin', 'manager', 'sales_agent', 'accountant', 'project_manager']::public.organization_role[]));
create policy "Leaders delete tasks"
on public.tasks for delete to authenticated
using (private.has_org_role(organization_id, array['owner', 'admin', 'manager']::public.organization_role[]));

create policy "Members read documents"
on public.documents for select to authenticated using (private.is_org_member(organization_id));
create policy "Operational team creates documents"
on public.documents for insert to authenticated
with check (private.has_org_role(organization_id, array['owner', 'admin', 'manager', 'sales_agent', 'accountant', 'project_manager']::public.organization_role[]));
create policy "Operational team deletes documents"
on public.documents for delete to authenticated
using (private.has_org_role(organization_id, array['owner', 'admin', 'manager', 'sales_agent', 'accountant', 'project_manager']::public.organization_role[]));

create policy "Public creates inquiries"
on public.inquiries for insert to anon
with check (
  exists (
    select 1 from public.properties property
    where property.id = property_id
      and property.organization_id = organization_id
      and property.is_published
  )
);
create policy "Members read inquiries"
on public.inquiries for select to authenticated using (private.is_org_member(organization_id));
create policy "Sales team updates inquiries"
on public.inquiries for update to authenticated
using (private.has_org_role(organization_id, array['owner', 'admin', 'manager', 'sales_agent']::public.organization_role[]))
with check (private.has_org_role(organization_id, array['owner', 'admin', 'manager', 'sales_agent']::public.organization_role[]));
create policy "Leaders delete inquiries"
on public.inquiries for delete to authenticated
using (private.has_org_role(organization_id, array['owner', 'admin', 'manager']::public.organization_role[]));

create policy "Leaders read audit logs"
on public.audit_logs for select to authenticated
using (private.has_org_role(organization_id, array['owner', 'admin', 'manager', 'accountant']::public.organization_role[]));

drop policy if exists "Authenticated staff upload property images" on storage.objects;
drop policy if exists "Authenticated staff update property images" on storage.objects;
drop policy if exists "Authenticated staff delete property images" on storage.objects;

create policy "Organization uploads property images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'property-images'
  and private.is_org_member(private.safe_uuid((storage.foldername(name))[1]))
);
create policy "Organization updates property images"
on storage.objects for update to authenticated
using (
  bucket_id = 'property-images'
  and private.is_org_member(private.safe_uuid((storage.foldername(name))[1]))
)
with check (
  bucket_id = 'property-images'
  and private.is_org_member(private.safe_uuid((storage.foldername(name))[1]))
);
create policy "Organization deletes property images"
on storage.objects for delete to authenticated
using (
  bucket_id = 'property-images'
  and private.is_org_member(private.safe_uuid((storage.foldername(name))[1]))
);

grant usage on schema public to anon, authenticated;
grant select on public.properties to anon;
grant insert on public.inquiries to anon;

grant select, update on public.organizations to authenticated;
grant select, insert, update, delete on public.branches to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.organization_members to authenticated;
grant select, insert, update, delete on public.projects to authenticated;
grant select, insert, update, delete on public.contacts to authenticated;
grant select, insert, update, delete on public.properties to authenticated;
grant select, insert, update, delete on public.leads to authenticated;
grant select, insert, update, delete on public.deals to authenticated;
grant select, insert, update, delete on public.installments to authenticated;
grant select, insert, update, delete on public.expenses to authenticated;
grant select, insert, update, delete on public.receipts to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;
grant select, insert, delete on public.documents to authenticated;
grant select, update, delete on public.inquiries to authenticated;
grant select on public.audit_logs to authenticated;
grant usage, select on sequence public.contract_number_seq to authenticated;

create view public.deal_financial_summary
with (security_invoker = true)
as
select
  deal.id as deal_id,
  deal.organization_id,
  deal.contract_number,
  deal.status,
  deal.total_value,
  deal.down_payment,
  deal.discount,
  deal.currency,
  coalesce(sum(installment.amount), 0) as scheduled_amount,
  coalesce(sum(installment.paid_amount), 0) as collected_amount,
  coalesce(sum(installment.amount - installment.paid_amount), 0) as outstanding_amount,
  min(installment.due_date) filter (
    where installment.status in ('pending', 'partial', 'overdue')
  ) as next_due_date,
  count(*) filter (where installment.status = 'overdue') as overdue_count
from public.deals deal
left join public.installments installment on installment.deal_id = deal.id
group by deal.id;

grant select on public.deal_financial_summary to authenticated;
