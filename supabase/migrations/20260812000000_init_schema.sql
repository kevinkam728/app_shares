-- Create Tables
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  role text default 'user' check (role in ('user', 'advisor', 'pending_advisor')),
  cnv_pdf_url text,
  created_at timestamptz default now()
);

create table if not exists public.portfolios (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  balance_usd numeric default 10000.00,
  created_at timestamptz default now()
);

create table if not exists public.simulated_trades (
  id uuid default gen_random_uuid() primary key,
  portfolio_id uuid references public.portfolios on delete cascade not null,
  ticker text not null,
  amount_invested numeric not null,
  buy_price numeric not null,
  buy_date timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.portfolios enable row level security;
alter table public.simulated_trades enable row level security;

-- Policies
drop policy if exists "Public profiles are viewable" on public.profiles;
create policy "Public profiles are viewable" on public.profiles for select using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

drop policy if exists "Users can view own portfolio" on public.portfolios;
create policy "Users can view own portfolio" on public.portfolios for select using (auth.uid() = user_id);

drop policy if exists "Users can view own trades" on public.simulated_trades;
create policy "Users can view own trades" on public.simulated_trades for select 
using (exists (select 1 from public.portfolios where id = portfolio_id and user_id = auth.uid()));

-- Create Storage Bucket for CNV Certificates
insert into storage.buckets (id, name, public) 
values ('cnv_certs', 'cnv_certs', true)
on conflict (id) do nothing;

-- Storage Policy: Users can upload their own files
create policy "Users can upload their own files" on storage.objects for insert with check (bucket_id = 'cnv_certs' and auth.role() = 'authenticated');
create policy "Users can read their own files" on storage.objects for select using (bucket_id = 'cnv_certs' and auth.role() = 'authenticated');
