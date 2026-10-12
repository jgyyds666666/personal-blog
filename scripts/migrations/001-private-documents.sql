-- Run once in the Supabase SQL editor before uploading private documents.
begin;

create table if not exists public.private_documents (
  id uuid primary key,
  title varchar(255) not null,
  excerpt varchar(500) not null default '',
  format varchar(4) not null check (format in ('md', 'txt', 'docx')),
  original_name text not null,
  original_key text not null,
  content text not null,
  assets jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists private_documents_created_at_idx
  on public.private_documents (created_at desc);

alter table public.private_documents enable row level security;
-- Our password login is verified by Next.js, not Supabase Auth.
-- Only the server's service_role may access this table. No public RLS policies.
revoke all on public.private_documents from public, anon, authenticated;
grant select, insert, update, delete on public.private_documents to service_role;

insert into storage.buckets (id, name, public, file_size_limit)
values ('private-documents', 'private-documents', false, 10485760)
on conflict (id) do update set public = false, file_size_limit = 10485760;

-- Restrictive policy also blocks access if another bucket has broad permissive policies.
drop policy if exists private_documents_server_only on storage.objects;
create policy private_documents_server_only on storage.objects
  as restrictive for all to anon, authenticated
  using (bucket_id <> 'private-documents')
  with check (bucket_id <> 'private-documents');

commit;
