-- Secure, email-bound organization onboarding without service-role keys in the browser.
create table public.organization_invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  email text not null check (email = lower(email) and length(email) between 3 and 320),
  role public.organization_role not null default 'viewer',
  token uuid not null unique default gen_random_uuid(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  invited_by uuid not null references auth.users(id) on delete restrict default auth.uid(),
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  check (accepted_at is null or accepted_by is not null)
);

create unique index organization_invites_open_email_idx
on public.organization_invites(organization_id, email)
where accepted_at is null;
create index organization_invites_organization_idx on public.organization_invites(organization_id, created_at desc);
create index organization_invites_branch_idx on public.organization_invites(branch_id);
create index organization_invites_invited_by_idx on public.organization_invites(invited_by);
create index organization_invites_accepted_by_idx on public.organization_invites(accepted_by);

alter table public.organization_invites enable row level security;

create policy "Leaders manage organization invitations"
on public.organization_invites for all to authenticated
using (private.has_org_role(organization_id, array['owner', 'admin', 'manager']::public.organization_role[]))
with check (private.has_org_role(organization_id, array['owner', 'admin', 'manager']::public.organization_role[]));

create or replace function public.accept_organization_invite(invite_token uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_email text;
  invite public.organization_invites%rowtype;
begin
  if current_user_id is null then
    raise exception 'Authentication is required';
  end if;

  select lower(users.email)
  into current_email
  from auth.users users
  where users.id = current_user_id;

  select invitation.*
  into invite
  from public.organization_invites invitation
  where invitation.token = invite_token
  for update;

  if invite.id is null then
    raise exception 'Invitation not found';
  end if;
  if invite.accepted_at is not null then
    raise exception 'Invitation has already been accepted';
  end if;
  if invite.expires_at <= now() then
    raise exception 'Invitation has expired';
  end if;
  if current_email is null or current_email <> invite.email then
    raise exception 'Sign in with the invited email address';
  end if;

  insert into public.profiles (user_id, full_name, locale)
  select
    users.id,
    coalesce(nullif(users.raw_user_meta_data ->> 'full_name', ''), split_part(users.email, '@', 1), 'Team member'),
    'en'
  from auth.users users
  where users.id = current_user_id
  on conflict (user_id) do nothing;

  insert into public.organization_members (organization_id, user_id, branch_id, role, is_active)
  values (invite.organization_id, current_user_id, invite.branch_id, invite.role, true)
  on conflict (organization_id, user_id) do update set
    branch_id = excluded.branch_id,
    role = excluded.role,
    is_active = true,
    updated_at = now();

  update public.organization_invites
  set accepted_by = current_user_id, accepted_at = now()
  where id = invite.id;

  return invite.organization_id;
end;
$$;

revoke execute on function public.accept_organization_invite(uuid) from public, anon;
grant execute on function public.accept_organization_invite(uuid) to authenticated;
grant select, insert, update, delete on public.organization_invites to authenticated;

create trigger audit_organization_invites
after insert or update or delete on public.organization_invites
for each row execute function private.capture_audit_log();
