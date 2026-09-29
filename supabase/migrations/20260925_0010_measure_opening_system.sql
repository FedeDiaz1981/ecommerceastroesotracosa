update public.products as product
set measures = coalesce(
  (
    select jsonb_agg(
      measure
      || case
        when measure ? 'openingSystemImage' then '{}'::jsonb
        else jsonb_build_object('openingSystemImage', '/assets/images/medidas/02.svg')
      end
      || case
        when measure ? 'showOpeningSystem' then '{}'::jsonb
        else jsonb_build_object('showOpeningSystem', true)
      end
      order by position
    )
    from jsonb_array_elements(coalesce(product.measures, '[]'::jsonb))
      with ordinality as entries(measure, position)
  ),
  '[]'::jsonb
)
where jsonb_typeof(coalesce(product.measures, '[]'::jsonb)) = 'array';

