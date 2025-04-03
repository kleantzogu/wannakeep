-- Create buckets table
create table if not exists public.buckets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  name text not null,
  emoji text default '📁',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.buckets enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Enable read access for all users" on public.buckets;
drop policy if exists "Enable insert access for all users" on public.buckets;
drop policy if exists "Enable update access for all users" on public.buckets;
drop policy if exists "Enable delete access for all users" on public.buckets;

-- Create new policies
create policy "Users can view their own buckets"
  on public.buckets for select
  using (auth.uid() = user_id);

create policy "Users can insert their own buckets"
  on public.buckets for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own buckets"
  on public.buckets for update
  using (auth.uid() = user_id);

create policy "Users can delete their own buckets"
  on public.buckets for delete
  using (auth.uid() = user_id); 