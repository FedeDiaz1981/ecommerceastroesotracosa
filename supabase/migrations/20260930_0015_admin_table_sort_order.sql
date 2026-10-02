alter table public.product_lots add column if not exists sort_order integer not null default 0;
alter table public.product_lot_reservations add column if not exists sort_order integer not null default 0;
alter table public.brands add column if not exists sort_order integer not null default 0;
alter table public.fabrics add column if not exists sort_order integer not null default 0;
alter table public.categories add column if not exists sort_order integer not null default 0;
alter table public.users add column if not exists sort_order integer not null default 0;

with ranked as (select id, row_number() over (order by id)::integer as position from public.product_lots)
update public.product_lots set sort_order = ranked.position from ranked where product_lots.id = ranked.id and product_lots.sort_order = 0;
with ranked as (select id, row_number() over (order by created_at, id)::integer as position from public.product_lot_reservations)
update public.product_lot_reservations set sort_order = ranked.position from ranked where product_lot_reservations.id = ranked.id and product_lot_reservations.sort_order = 0;
with ranked as (select id, row_number() over (order by name, id)::integer as position from public.brands)
update public.brands set sort_order = ranked.position from ranked where brands.id = ranked.id and brands.sort_order = 0;
with ranked as (select id, row_number() over (order by id)::integer as position from public.fabrics)
update public.fabrics set sort_order = ranked.position from ranked where fabrics.id = ranked.id and fabrics.sort_order = 0;
with ranked as (select id, row_number() over (order by id)::integer as position from public.categories)
update public.categories set sort_order = ranked.position from ranked where categories.id = ranked.id and categories.sort_order = 0;
with ranked as (select id, row_number() over (order by id)::integer as position from public.users)
update public.users set sort_order = ranked.position from ranked where users.id = ranked.id and users.sort_order = 0;
