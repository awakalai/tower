-- Cover Auth foreign keys used by staff audit queries and user deletion cascades.
create index properties_created_by_idx on public.properties (created_by);
create index expenses_created_by_idx on public.expenses (created_by);
create index receipts_issued_by_idx on public.receipts (issued_by);
