-- Annual budgets table
create table public.annual_budgets (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid references public.categories(id) on delete cascade not null,
  household_id uuid not null,
  year integer not null,
  amount numeric not null check (amount >= 0),
  created_at timestamptz default now(),
  unique(category_id, household_id, year)
);

create index idx_annual_budgets_household on public.annual_budgets(household_id);
create index idx_annual_budgets_year on public.annual_budgets(year);

alter table public.annual_budgets enable row level security;

create policy "Users can view their household annual budgets"
  on public.annual_budgets for select
  using (household_id in (select household_id from public.profiles where id = auth.uid()));

create policy "Users can insert their household annual budgets"
  on public.annual_budgets for insert
  with check (household_id in (select household_id from public.profiles where id = auth.uid()));

create policy "Users can update their household annual budgets"
  on public.annual_budgets for update
  using (household_id in (select household_id from public.profiles where id = auth.uid()));

create policy "Users can delete their household annual budgets"
  on public.annual_budgets for delete
  using (household_id in (select household_id from public.profiles where id = auth.uid()));
