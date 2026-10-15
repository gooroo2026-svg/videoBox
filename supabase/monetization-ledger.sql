-- VideoBox admin money ledger. Safe to run again.
-- Records manually entered business income/expenses only. This is not live AdSense reporting or payouts.

create table if not exists public.money_entries (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('income', 'expense')),
  source text not null check (char_length(trim(source)) between 1 and 100),
  description text check (description is null or char_length(description) <= 1000),
  amount numeric(14,2) not null check (amount > 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  recorded_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

alter table public.money_entries
  add column if not exists recorded_by uuid references auth.users(id) on delete set null default auth.uid();
alter table public.money_entries enable row level security;

-- Remove any older permissive policies: PostgreSQL policies combine permissively by default.
do $$
declare
  existing_policy record;
begin
  for existing_policy in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'money_entries'
  loop
    execute format('drop policy %I on public.money_entries', existing_policy.policyname);
  end loop;
end $$;

revoke all on table public.money_entries from public, anon, authenticated;
grant select, insert on table public.money_entries to authenticated;

create policy money_entries_admin_read on public.money_entries
  for select to authenticated
  using (public.is_admin());
create policy money_entries_admin_insert on public.money_entries
  for insert to authenticated
  with check (public.is_admin());
-- No update or delete policy: recorded entries stay as an audit trail.
