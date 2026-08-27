-- Private, tenant-isolated document vault for contracts and project records.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'enterprise-documents',
  'enterprise-documents',
  false,
  26214400,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Members read enterprise documents"
on storage.objects for select to authenticated
using (
  bucket_id = 'enterprise-documents'
  and private.is_org_member(private.safe_uuid((storage.foldername(name))[1]))
);

create policy "Operational team uploads enterprise documents"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'enterprise-documents'
  and private.has_org_role(
    private.safe_uuid((storage.foldername(name))[1]),
    array['owner', 'admin', 'manager', 'sales_agent', 'accountant', 'project_manager']::public.organization_role[]
  )
);

create policy "Operational team updates enterprise documents"
on storage.objects for update to authenticated
using (
  bucket_id = 'enterprise-documents'
  and private.has_org_role(
    private.safe_uuid((storage.foldername(name))[1]),
    array['owner', 'admin', 'manager', 'sales_agent', 'accountant', 'project_manager']::public.organization_role[]
  )
)
with check (
  bucket_id = 'enterprise-documents'
  and private.has_org_role(
    private.safe_uuid((storage.foldername(name))[1]),
    array['owner', 'admin', 'manager', 'sales_agent', 'accountant', 'project_manager']::public.organization_role[]
  )
);

create policy "Operational team deletes enterprise documents"
on storage.objects for delete to authenticated
using (
  bucket_id = 'enterprise-documents'
  and private.has_org_role(
    private.safe_uuid((storage.foldername(name))[1]),
    array['owner', 'admin', 'manager', 'sales_agent', 'accountant', 'project_manager']::public.organization_role[]
  )
);

create policy "Operational team updates document metadata"
on public.documents for update to authenticated
using (
  private.has_org_role(
    organization_id,
    array['owner', 'admin', 'manager', 'sales_agent', 'accountant', 'project_manager']::public.organization_role[]
  )
)
with check (
  private.has_org_role(
    organization_id,
    array['owner', 'admin', 'manager', 'sales_agent', 'accountant', 'project_manager']::public.organization_role[]
  )
);

grant update on public.documents to authenticated;
