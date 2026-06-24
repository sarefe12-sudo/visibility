-- VisibilityRadar Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/bpmnuzlzhcfeolmdlejl/sql

-- Users
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  clerk_id text unique not null,
  email text not null,
  name text,
  user_type text not null default 'individual' check (user_type in ('individual', 'corporate', 'agency')),
  tier text not null default 'free' check (tier in ('free', 'pro', 'agency')),
  stripe_customer_id text,
  stripe_subscription_id text,
  analyses_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Analyses
create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  brand text not null,
  market text not null default 'global',
  overall_score numeric(5,1) not null default 0,
  active_models text[] not null default '{}',
  competitor_count integer not null default 0,
  prompt_count integer not null default 0,
  result_snapshot jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- RLS
alter table public.users enable row level security;
alter table public.analyses enable row level security;

-- Users: service role only (managed via API routes)
create policy "service_role_users" on public.users
  using (true)
  with check (true);

-- Analyses: users can read their own
create policy "users_own_analyses" on public.analyses
  for select using (
    user_id = (select id from public.users where clerk_id = auth.uid()::text)
  );

-- Indexes
create index if not exists analyses_user_id_idx on public.analyses(user_id);
create index if not exists analyses_created_at_idx on public.analyses(created_at desc);
create index if not exists users_clerk_id_idx on public.users(clerk_id);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger users_updated_at before update on public.users
  for each row execute function update_updated_at();
