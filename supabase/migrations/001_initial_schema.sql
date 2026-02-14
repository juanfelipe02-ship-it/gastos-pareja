-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text,
  partner_id uuid references public.profiles(id),
  household_id uuid,
  invite_code text unique,
  created_at timestamptz default now()
);

-- Categories table
create table public.categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  icon text not null default '📦',
  color text not null default '#6b7280',
  household_id uuid not null,
  created_at timestamptz default now()
);

-- Expenses table
create type split_type as enum ('50/50', 'solo_yo', 'solo_pareja', 'custom');

create table public.expenses (
  id uuid primary key default uuid_generate_v4(),
  amount numeric not null check (amount > 0),
  description text,
  category_id uuid references public.categories(id) on delete set null,
  paid_by uuid references public.profiles(id) not null,
  split_type split_type not null default '50/50',
  split_percentage numeric not null default 50,
  date date not null default current_date,
  created_by uuid references public.profiles(id) not null,
  household_id uuid not null,
  created_at timestamptz default now()
);

-- Settlements table
create table public.settlements (
  id uuid primary key default uuid_generate_v4(),
  amount numeric not null check (amount > 0),
  paid_by uuid references public.profiles(id) not null,
  paid_to uuid references public.profiles(id) not null,
  date date not null default current_date,
  household_id uuid not null,
  created_at timestamptz default now()
);

-- Indexes
create index idx_expenses_household on public.expenses(household_id);
create index idx_expenses_date on public.expenses(date desc);
create index idx_expenses_paid_by on public.expenses(paid_by);
create index idx_categories_household on public.categories(household_id);
create index idx_settlements_household on public.settlements(household_id);
create index idx_profiles_invite_code on public.profiles(invite_code);
create index idx_profiles_household on public.profiles(household_id);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.expenses enable row level security;
alter table public.settlements enable row level security;

-- RLS Policies for profiles
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can view partner profile"
  on public.profiles for select
  using (
    household_id in (
      select household_id from public.profiles where id = auth.uid()
    )
  );

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- RLS Policies for categories (household-based)
create policy "Users can view household categories"
  on public.categories for select
  using (
    household_id in (
      select household_id from public.profiles where id = auth.uid()
    )
  );

create policy "Users can insert household categories"
  on public.categories for insert
  with check (
    household_id in (
      select household_id from public.profiles where id = auth.uid()
    )
  );

create policy "Users can update household categories"
  on public.categories for update
  using (
    household_id in (
      select household_id from public.profiles where id = auth.uid()
    )
  );

-- RLS Policies for expenses (household-based)
create policy "Users can view household expenses"
  on public.expenses for select
  using (
    household_id in (
      select household_id from public.profiles where id = auth.uid()
    )
  );

create policy "Users can insert household expenses"
  on public.expenses for insert
  with check (
    household_id in (
      select household_id from public.profiles where id = auth.uid()
    )
  );

create policy "Users can update household expenses"
  on public.expenses for update
  using (
    household_id in (
      select household_id from public.profiles where id = auth.uid()
    )
  );

create policy "Users can delete household expenses"
  on public.expenses for delete
  using (
    household_id in (
      select household_id from public.profiles where id = auth.uid()
    )
  );

-- RLS Policies for settlements (household-based)
create policy "Users can view household settlements"
  on public.settlements for select
  using (
    household_id in (
      select household_id from public.profiles where id = auth.uid()
    )
  );

create policy "Users can insert household settlements"
  on public.settlements for insert
  with check (
    household_id in (
      select household_id from public.profiles where id = auth.uid()
    )
  );

-- Enable realtime
alter publication supabase_realtime add table public.expenses;
alter publication supabase_realtime add table public.settlements;
