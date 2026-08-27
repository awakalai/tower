-- Keep the REST-facing RPC security-invoker; isolate privileged work in private schema.
alter function public.accept_organization_invite(uuid) set schema private;

revoke execute on function private.accept_organization_invite(uuid) from public, anon;
grant execute on function private.accept_organization_invite(uuid) to authenticated;

create function public.accept_organization_invite(invite_token uuid)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.accept_organization_invite(invite_token);
$$;

revoke execute on function public.accept_organization_invite(uuid) from public, anon;
grant execute on function public.accept_organization_invite(uuid) to authenticated;
