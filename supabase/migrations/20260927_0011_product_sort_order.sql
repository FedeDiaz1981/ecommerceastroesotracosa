alter table public.products
  add column if not exists sort_order integer not null default 0;

with ranked as (
  select id, row_number() over (order by id)::integer as position
  from public.products
)
update public.products
set sort_order = ranked.position
from ranked
where products.id = ranked.id and products.sort_order = 0;

create index if not exists products_sort_order_idx
  on public.products (sort_order, id);
