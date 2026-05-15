-- Create contacts table
create table contacts (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  origin text,
  experiences_count integer default 0,
  phone text,
  observations text
);

-- Enable Row Level Security (RLS)
alter table contacts enable row level security;

-- Create policy to allow all actions for now (you can restrict this later)
create policy "Allow all actions for authenticated users"
on contacts for all
to authenticated
using (true)
with check (true);

-- Also allow public access for development if needed (CAUTION)
-- create policy "Allow public access"
-- on contacts for all
-- to anon
-- using (true)
-- with check (true);
