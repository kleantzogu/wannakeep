-- Create a new storage bucket for documents
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true);

-- Set up storage policies
create policy "Anyone can upload documents"
  on storage.objects for insert
  with check ( bucket_id = 'documents' );

create policy "Anyone can read documents"
  on storage.objects for select
  using ( bucket_id = 'documents' );

create policy "Anyone can update documents"
  on storage.objects for update
  using ( bucket_id = 'documents' );

create policy "Anyone can delete documents"
  on storage.objects for delete
  using ( bucket_id = 'documents' ); 