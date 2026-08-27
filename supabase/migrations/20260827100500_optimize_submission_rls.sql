-- Evaluate one SELECT policy per role to avoid duplicate policy checks while
-- preserving strict owner isolation and organization staff visibility.
drop policy if exists "Owners read their property submissions" on public.property_submissions;
drop policy if exists "Staff read organization property submissions" on public.property_submissions;

create policy "Owners and staff read permitted submissions"
on public.property_submissions for select to authenticated
using (
  owner_id = (select auth.uid())
  or private.is_org_member(organization_id)
);
