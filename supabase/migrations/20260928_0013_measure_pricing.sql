-- Move existing product-level pricing into every existing measure.
-- Legacy columns remain as a fallback for products without measures.
update public.products
set measures = (
  select jsonb_agg(
    measure || jsonb_build_object(
      'cashPrice', coalesce(nullif(measure->>'cashPrice', '')::numeric, products.cash_price, nullif(measure->>'publicPrice', '')::numeric),
      'offerPrice', coalesce(nullif(measure->>'offerPrice', '')::numeric, products.offer_price),
      'offerMode', coalesce(nullif(measure->>'offerMode', ''), products.offer_mode, 'off'),
      'offerWeekdays', coalesce(measure->'offerWeekdays', products.offer_weekdays, '[]'::jsonb),
      'offerStartDate', coalesce(measure->'offerStartDate', to_jsonb(products.offer_start_date)),
      'offerEndDate', coalesce(measure->'offerEndDate', to_jsonb(products.offer_end_date))
    )
  )
  from jsonb_array_elements(products.measures) as measure
)
where jsonb_array_length(coalesce(measures, '[]'::jsonb)) > 0;
