-- ============================================================
-- Practice Deadline Tracker — Supabase schema
-- Run this once in your Supabase project:
--   Dashboard -> SQL Editor -> New query -> paste -> Run
-- ============================================================

-- Clients ----------------------------------------------------
create table if not exists public.clients (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  type       text not null,
  ref        text,
  notes      text,
  created_at timestamptz not null default now()
);

-- Jobs / deadlines -------------------------------------------
create table if not exists public.tasks (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references public.clients(id) on delete cascade,
  type         text not null,
  label        text,
  due          date not null,
  freq         text not null default 'one-off',
  notes        text,
  done         boolean not null default false,
  completed_on date,
  created_at   timestamptz not null default now()
);

create index if not exists tasks_due_idx on public.tasks (due);
create index if not exists tasks_client_idx on public.tasks (client_id);

-- Row Level Security -----------------------------------------
-- The anon key in index.html is PUBLIC and safe to publish.
-- Security comes from these policies: only signed-in team
-- members can read or change data. You decide who can sign in
-- (see README: turn OFF open sign-ups and invite your team).
alter table public.clients enable row level security;
alter table public.tasks   enable row level security;

drop policy if exists "team access clients" on public.clients;
create policy "team access clients" on public.clients
  for all to authenticated using (true) with check (true);

drop policy if exists "team access tasks" on public.tasks;
create policy "team access tasks" on public.tasks
  for all to authenticated using (true) with check (true);

-- Live updates (so everyone's screen refreshes on a change) ---
alter publication supabase_realtime add table public.clients;
alter publication supabase_realtime add table public.tasks;
