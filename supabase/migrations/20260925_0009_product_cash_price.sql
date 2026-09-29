alter table public.products
  add column if not exists cash_price integer;

update public.products
set cash_price = member_price
where cash_price is null;

alter table public.products
  alter column cash_price set default 0,
  alter column cash_price set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_cash_price_nonnegative'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_cash_price_nonnegative check (cash_price >= 0);
  end if;
end
$$;
