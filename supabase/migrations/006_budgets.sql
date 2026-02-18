-- Budget projections per category per month
create table public.budgets (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid references public.categories(id) on delete cascade not null,
  household_id uuid not null,
  month date not null,
  amount numeric not null check (amount >= 0),
  created_at timestamptz default now(),

  unique(category_id, household_id, month)
);

create index idx_budgets_household on public.budgets(household_id);
create index idx_budgets_month on public.budgets(month);

-- RLS
alter table public.budgets enable row level security;

create policy "Users can view household budgets"
  on public.budgets for select
  using (
    household_id in (
      select household_id from public.profiles where id = auth.uid()
    )
  );

create policy "Users can insert household budgets"
  on public.budgets for insert
  with check (
    household_id in (
      select household_id from public.profiles where id = auth.uid()
    )
  );

create policy "Users can update household budgets"
  on public.budgets for update
  using (
    household_id in (
      select household_id from public.profiles where id = auth.uid()
    )
  );

create policy "Users can delete household budgets"
  on public.budgets for delete
  using (
    household_id in (
      select household_id from public.profiles where id = auth.uid()
    )
  );
