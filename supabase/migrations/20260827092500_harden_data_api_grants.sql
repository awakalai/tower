-- Remove implicit Data API privileges; re-grant only intentional public operations.
revoke all on table
  public.organizations,
  public.branches,
  public.profiles,
  public.organization_members,
  public.organization_invites,
  public.projects,
  public.contacts,
  public.leads,
  public.deals,
  public.installments,
  public.expenses,
  public.receipts,
  public.tasks,
  public.documents,
  public.inquiries,
  public.audit_logs
from anon, public;

revoke all on sequence public.contract_number_seq from anon, public;
revoke all on sequence public.audit_logs_id_seq from anon, public;

-- The public portal reads published inventory and submits inquiries only.
grant select on public.properties to anon;
grant insert on public.inquiries to anon;
