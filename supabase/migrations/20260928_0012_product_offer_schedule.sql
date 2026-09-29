alter table public.products
  add column if not exists offer_price integer,
  add column if not exists offer_mode text not null default 'off',
  add column if not exists offer_weekdays jsonb not null default '[]'::jsonb,
  add column if not exists offer_start_date date,
  add column if not exists offer_end_date date;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'products_offer_mode_check'
  ) then
    alter table public.products
      add constraint products_offer_mode_check
      check (offer_mode in ('off', 'manual', 'weekly', 'period'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'products_offer_price_check'
  ) then
    alter table public.products
      add constraint products_offer_price_check
      check (offer_price is null or offer_price > 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'products_offer_period_check'
  ) then
    alter table public.products
      add constraint products_offer_period_check
      check (offer_start_date is null or offer_end_date is null or offer_end_date >= offer_start_date);
  end if;
end
$$;

create index if not exists products_offer_mode_idx
  on public.products (offer_mode)
  where offer_mode <> 'off';

