-- 1. Tabela de Statuses (Etapas da Jornada)
create table if not exists statuses (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null unique
);

-- 2. Tabela de Contatos (Viajantes)
create table if not exists contacts (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  cpf text,
  origin text,
  experiences_count integer default 0,
  phone text,
  status text default 'Prospecto',
  last_interaction date,
  avisar text default 'Sempre',
  remedio text default 'não informado',
  medications_list jsonb default '[]'::jsonb,
  observations text
);

-- 3. Tabela de Eventos (Cerimônias)
create table if not exists events (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  date date,
  date2 date,
  description text
);

-- 4. Tabela de Relacionamento (Participantes do Evento)
create table if not exists event_participants (
  event_id uuid references events(id) on delete cascade,
  contact_id uuid references contacts(id) on delete cascade,
  status text default 'Confirmado',
  date1_confirmed boolean default true,
  date2_confirmed boolean default true,
  remedio_status text default 'não informado',
  pago boolean default false,
  vaga text default 'Automático',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (event_id, contact_id)
);

-- 5. Ativação de Row Level Security (RLS) para todas as tabelas
alter table statuses enable row level security;
alter table contacts enable row level security;
alter table events enable row level security;
alter table event_participants enable row level security;

-- 6. Criação das políticas de segurança RLS (Permitir acesso completo para usuários autenticados)
drop policy if exists "Allow all actions for authenticated users on statuses" on statuses;
create policy "Allow all actions for authenticated users on statuses"
on statuses for all to authenticated using (true) with check (true);

drop policy if exists "Allow all actions for authenticated users on contacts" on contacts;
create policy "Allow all actions for authenticated users on contacts"
on contacts for all to authenticated using (true) with check (true);

drop policy if exists "Allow all actions for authenticated users on events" on events;
create policy "Allow all actions for authenticated users on events"
on events for all to authenticated using (true) with check (true);

drop policy if exists "Allow all actions for authenticated users on event_participants" on event_participants;
create policy "Allow all actions for authenticated users on event_participants"
on event_participants for all to authenticated using (true) with check (true);

-- 7. Criação das políticas para acesso público anônimo (Necessário para a Ficha Médica Pública funcionar sem login)
drop policy if exists "Allow public read contacts" on contacts;
create policy "Allow public read contacts"
on contacts for select to anon using (true);

drop policy if exists "Allow public update contacts" on contacts;
create policy "Allow public update contacts"
on contacts for update to anon using (true) with check (true);

drop policy if exists "Allow public insert contacts" on contacts;
create policy "Allow public insert contacts"
on contacts for insert to anon with check (true);
