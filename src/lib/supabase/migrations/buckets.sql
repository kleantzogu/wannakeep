-- Create buckets table
create table if not exists public.buckets (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  emoji text default '📁',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.buckets enable row level security;

-- Create policies
create policy "Enable read access for all users" on public.buckets
  for select using (true);

create policy "Enable insert access for all users" on public.buckets
  for insert with check (true);

create policy "Enable update access for all users" on public.buckets
  for update using (true);

create policy "Enable delete access for all users" on public.buckets
  for delete using (true); 