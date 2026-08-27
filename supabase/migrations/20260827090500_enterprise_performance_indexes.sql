-- Cover audit/ownership foreign keys used by operational reporting.
create index contacts_created_by_idx on public.contacts(created_by);
create index deals_created_by_idx on public.deals(created_by);
create index leads_created_by_idx on public.leads(created_by);
create index projects_created_by_idx on public.projects(created_by);
create index tasks_created_by_idx on public.tasks(created_by);
