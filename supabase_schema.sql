-- Create contacts table
create table contacts (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  origin text,
  experiences_count integer default 0,
  phone text,
  status text default 'Prospecto',
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


-- Criar tabela de eventos
create table events (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  date date,
  description text
);

-- Tabela de relacionamento: Participantes do evento
create table event_participants (
  event_id uuid references events(id) on delete cascade,
  contact_id uuid references contacts(id) on delete cascade,
  status text default 'Confirmado',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (event_id, contact_id)
);
