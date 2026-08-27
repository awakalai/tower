-- The intake trigger always derives the organization from the published
-- property. A default keeps generated client types aligned with that contract.
alter table public.inquiries
  alter column organization_id set default private.current_org_id();

