-- Repair an existing private_documents table without recreating it.
-- Run in the Supabase SQL editor; repeat execution is safe.
begin;

alter table public.private_documents
  add column if not exists assets jsonb not null default '[]'::jsonb;

notify pgrst, 'reload schema';
commit;

-- Confirm the column exists after the transaction commits.
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'private_documents'
  and column_name = 'assets';
