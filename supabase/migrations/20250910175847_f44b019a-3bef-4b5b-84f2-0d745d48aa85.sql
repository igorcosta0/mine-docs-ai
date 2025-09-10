-- Create enums for document types and status
create type doc_type_enum as enum ('especificacao_tecnica');
create type doc_status_enum as enum ('ingested','processing','error');

-- Create documents table
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  doc_type doc_type_enum not null,
  doc_number text not null,
  rev text not null,
  title text not null,
  customer text,
  project text,
  contractor text,
  issue_date date,
  classification text,
  disciplines text[],
  norms text[],
  location text,
  figures_tables text[],
  extra jsonb not null default '{}'::jsonb,
  storage_path text not null,
  checksum_sha256 text not null,
  status doc_status_enum not null default 'ingested',
  uploader uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint documents_doc_rev_unique unique (doc_number, rev)
);

-- Enable RLS
alter table documents enable row level security;

-- Create RLS policies
create policy "read_own_or_public"
  on documents for select
  to authenticated
  using (uploader = auth.uid() or coalesce((extra->>'public')::boolean, false) = true);

create policy "insert_own"
  on documents for insert
  to authenticated
  with check (uploader = auth.uid());

create policy "update_own"
  on documents for update
  to authenticated
  using (uploader = auth.uid())
  with check (uploader = auth.uid());

create policy "delete_own"
  on documents for delete
  to authenticated
  using (uploader = auth.uid());

-- Create indexes
create index if not exists idx_documents_type_issue on documents (doc_type, issue_date desc);
create index if not exists idx_documents_extra_gin on documents using gin (extra);
create index if not exists idx_documents_uploader on documents (uploader);

-- Create storage bucket for documents
insert into storage.buckets (id, name, public) values ('datalake-docs', 'datalake-docs', false);

-- Create storage policies for datalake-docs bucket
create policy "Users can view their own documents"
  on storage.objects for select
  using (bucket_id = 'datalake-docs' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can upload their own documents"
  on storage.objects for insert
  with check (bucket_id = 'datalake-docs' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update their own documents"
  on storage.objects for update
  using (bucket_id = 'datalake-docs' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete their own documents"
  on storage.objects for delete
  using (bucket_id = 'datalake-docs' and auth.uid()::text = (storage.foldername(name))[1]);

-- Create updated_at trigger
create trigger update_documents_updated_at
  before update on documents
  for each row
  execute function public.update_updated_at_column();