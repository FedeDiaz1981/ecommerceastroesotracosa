<?php
require dirname(__DIR__) . '/_bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(['error' => 'Method not allowed.'], 405);
requireAdmin();

$request = body();
$action = (string) ($request['action'] ?? '');
$table = (string) ($request['table'] ?? '');

function listValue($value): array {
  if (is_array($value)) return $value;
  if (!is_string($value) || trim($value) === '') return [];
  $decoded = json_decode($value, true);
  return is_array($decoded) ? $decoded : [];
}

function intValue($value, int $fallback = 0): int {
  return is_numeric($value) ? (int) $value : $fallback;
}

function boolValue($value): bool {
  return $value === true || $value === 1 || $value === '1' || $value === 'true';
}

function nextProductId(): int {
  [, $rows] = supabase('GET', 'products?select=id&order=id.desc&limit=1');
  return intValue($rows[0]['id'] ?? 0) + 1;
}

function nextProductCopyName(string $sourceName): string {
  $baseName = trim((string) preg_replace('/\s+-\s+copia(?:\s+\d{2})?$/iu', '', $sourceName));
  if ($baseName === '') $baseName = trim($sourceName);

  [, $rows] = supabase('GET', 'products?deleted_at=is.null&select=name&name=like.' . rawurlencode($baseName . ' - copia*'));
  $usedNames = [];
  foreach ($rows as $row) $usedNames[strtolower(trim((string) ($row['name'] ?? '')))] = true;

  $firstName = $baseName . ' - copia';
  if (!isset($usedNames[strtolower($firstName)])) return $firstName;

  for ($suffix = 1; $suffix <= 99; $suffix++) {
    $candidate = $baseName . ' - copia ' . str_pad((string) $suffix, 2, '0', STR_PAD_LEFT);
    if (!isset($usedNames[strtolower($candidate)])) return $candidate;
  }

  respond(['error' => 'No se pudieron generar más nombres de copia para este producto.'], 422);
}

function productPayload(array $record, int $id): array {
  $categoryIds = array_values(array_filter(array_map('intval', listValue($record['categoryIds'] ?? [])), fn($value) => $value > 0));
  if (count($categoryIds) === 0) respond(['error' => 'El producto necesita al menos una categoria.'], 422);
  [, $categories] = supabase('GET', 'categories?id=in.(' . implode(',', $categoryIds) . ')&select=id,name');
  $namesById = [];
  foreach ($categories as $category) $namesById[intValue($category['id'] ?? 0)] = (string) ($category['name'] ?? '');
  $categoryNames = array_values(array_filter(array_map(fn($categoryId) => $namesById[$categoryId] ?? '', $categoryIds)));
  if (count($categoryNames) !== count($categoryIds)) respond(['error' => 'Una de las categorias elegidas no existe.'], 422);

  $measures = listValue($record['measures'] ?? []);
  if (count($measures) === 0) respond(['error' => 'El producto necesita al menos una medida con precios.'], 422);
  foreach ($measures as $measure) {
    if (!is_array($measure) || trim((string) ($measure['label'] ?? '')) === '' || intValue($measure['publicPrice'] ?? 0) <= 0 || intValue($measure['cashPrice'] ?? 0) <= 0) {
      respond(['error' => 'Cada medida debe tener nombre, precio de lista y precio en efectivo.'], 422);
    }
  }
  $firstMeasure = $measures[0];
  $images = array_values(array_filter(array_map('strval', listValue($record['images'] ?? []))));
  $installments = listValue($record['installments'] ?? []);
  $installmentCount = 0;
  $interestFree = [];
  foreach ($installments as $installment) {
    if (!is_array($installment)) continue;
    $count = intValue($installment['count'] ?? 0);
    $installmentCount = max($installmentCount, $count);
    if ($count > 0 && boolValue($installment['interestFree'] ?? false)) $interestFree[] = $count;
  }
  $active = !array_key_exists('active', $record) || boolValue($record['active']);
  $publicPrice = intValue($firstMeasure['publicPrice'] ?? 0);
  $cashPrice = intValue($firstMeasure['cashPrice'] ?? $publicPrice);
  $offerPrice = intValue($firstMeasure['offerPrice'] ?? 0) ?: null;
  $offerMode = (string) ($firstMeasure['offerMode'] ?? 'off');
  $offerWeekdays = listValue($firstMeasure['offerWeekdays'] ?? []);
  $sku = trim((string) ($record['sku'] ?? '')) ?: 'PF' . str_pad((string) $id, 4, '0', STR_PAD_LEFT);
  $name = trim((string) ($record['name'] ?? ''));
  if ($name === '') respond(['error' => 'El nombre es obligatorio.'], 422);

  return [
    'id' => $id,
    'sort_order' => max(1, intValue($record['sortOrder'] ?? 1)),
    'sku' => $sku,
    'name' => $name,
    'detail' => trim((string) ($record['detail'] ?? $name)),
    'presentation' => (string) ($record['presentation'] ?? ''),
    'category_id' => $categoryIds[0],
    'category_name' => $categoryNames[0],
    'category_ids' => $categoryIds,
    'category_names' => $categoryNames,
    'brand' => (string) ($record['brand'] ?? ''),
    'vegano' => boolValue($record['vegano'] ?? false),
    'kosher' => boolValue($record['kosher'] ?? false),
    'testeado_en_animales' => array_key_exists('testeadoEnAnimales', $record) ? boolValue($record['testeadoEnAnimales']) : null,
    'public_price' => $publicPrice,
    'member_price' => $publicPrice,
    'cash_price' => $cashPrice,
    'offer_price' => $offerPrice,
    'offer_mode' => in_array($offerMode, ['off', 'manual', 'weekly', 'period'], true) ? $offerMode : 'off',
    'offer_weekdays' => $offerWeekdays,
    'offer_start_date' => $firstMeasure['offerStartDate'] ?: null,
    'offer_end_date' => $firstMeasure['offerEndDate'] ?: null,
    'measures' => $measures,
    'installment_count' => $installmentCount,
    'interest_free_installments' => array_values(array_unique($interestFree)),
    'image' => $images[0] ?? null,
    'images' => $images,
    'fabric_ids' => array_values(array_filter(array_map('intval', listValue($record['fabricIds'] ?? [])), fn($value) => $value > 0)),
    'related_product_ids' => array_values(array_filter(array_map('intval', listValue($record['relatedProductIds'] ?? [])), fn($value) => $value > 0 && $value !== $id)),
    'only_members' => boolValue($record['onlyMembers'] ?? false),
    'status' => $active ? 'published' : 'inactive',
    'featured' => boolValue($record['featured'] ?? false),
    'featured_priority' => intValue($record['featuredPriority'] ?? 0) ?: null,
    'trending' => boolValue($record['trending'] ?? false),
    'stock' => null,
    'views_count' => intValue($record['viewsCount'] ?? 0),
    'sales_count' => intValue($record['salesCount'] ?? 0),
    'description' => (string) ($record['description'] ?? ''),
    'source_section' => (string) ($record['sourceSection'] ?? ''),
    'template_row_map' => listValue($record['templateRowMap'] ?? []),
  ];
}

$orderableTables = [
  'products' => ['relation' => 'products', 'column' => 'sort_order'],
  'product_lots' => ['relation' => 'product_lots', 'column' => 'sort_order'],
  'product_lot_reservations' => ['relation' => 'product_lot_reservations', 'column' => 'sort_order'],
  'packs' => ['relation' => 'promotion_packs', 'column' => 'order_index'],
  'brands' => ['relation' => 'brands', 'column' => 'sort_order'],
  'payment_methods' => ['relation' => 'payment_methods', 'column' => 'order_index'],
  'fabrics' => ['relation' => 'fabrics', 'column' => 'sort_order'],
  'categories' => ['relation' => 'categories', 'column' => 'sort_order'],
  'users' => ['relation' => 'users', 'column' => 'sort_order'],
  'hero_slides' => ['relation' => 'hero_slides', 'column' => 'order_index'],
  'banners' => ['relation' => 'banners', 'column' => 'order_index'],
];

if ($action === 'reorder' || $action === 'reorder_products') {
  $definition = $orderableTables[$table] ?? null;
  if (!$definition) respond(['error' => 'Esta tabla no admite ordenamiento manual.'], 422);
  $ids = array_values(array_unique(array_filter(array_map('strval', listValue($request['ids'] ?? [])), fn($value) => trim($value) !== '')));
  if (count($ids) === 0) respond(['error' => 'Falta el orden de registros.'], 422);
  foreach ($ids as $index => $id) {
    [$status] = supabase('PATCH', $definition['relation'] . '?id=eq.' . rawurlencode($id), [$definition['column'] => $index + 1]);
    if ($status < 200 || $status >= 300) respond(['error' => 'No se pudo guardar el orden.'], 502);
  }
  respond(['ok' => true]);
}

if ($table !== 'products') respond(['error' => 'Esta tabla todavía no admite altas, ediciones ni borrados desde PHP.'], 422);

if ($action === 'clone_product') {
  $sourceId = intValue($request['id'] ?? 0);
  if ($sourceId <= 0) respond(['error' => 'Falta el producto que se quiere copiar.'], 422);

  [, $sourceRows] = supabase('GET', 'products?id=eq.' . $sourceId . '&deleted_at=is.null&select=*');
  $source = $sourceRows[0] ?? null;
  if (!is_array($source)) respond(['error' => 'El producto original no existe o fue eliminado.'], 404);

  $newId = nextProductId();
  [, $maxOrderRows] = supabase('GET', 'products?deleted_at=is.null&select=sort_order&order=sort_order.desc&limit=1');
  $clone = $source;
  unset($clone['deleted_at'], $clone['created_at'], $clone['updated_at']);
  $clone['id'] = $newId;
  $clone['sku'] = 'PF' . str_pad((string) $newId, 4, '0', STR_PAD_LEFT);
  $clone['name'] = nextProductCopyName((string) ($source['name'] ?? 'Producto'));
  $clone['sort_order'] = intValue($maxOrderRows[0]['sort_order'] ?? 0) + 1;

  [$status, $result] = supabase('POST', 'products', $clone);
  if ($status < 200 || $status >= 300) respond(['error' => 'Supabase no pudo crear la copia.', 'details' => $result], 502);
  respond(['ok' => true, 'id' => $newId, 'name' => $clone['name']]);
}

if ($action === 'save') {
  $record = is_array($request['payload'] ?? null) ? $request['payload'] : [];
  $id = intValue($record['id'] ?? 0) ?: nextProductId();
  $payload = productPayload($record, $id);
  [, $exists] = supabase('GET', 'products?id=eq.' . $id . '&select=id&limit=1');
  [$status, $result] = count($exists) > 0
    ? supabase('PATCH', 'products?id=eq.' . $id, $payload)
    : supabase('POST', 'products', $payload);
  if ($status < 200 || $status >= 300) respond(['error' => 'Supabase no pudo guardar el producto.', 'details' => $result], 502);
  respond(['ok' => true, 'id' => $id]);
}

if ($action === 'delete' || $action === 'delete_many') {
  $ids = $action === 'delete_many' ? listValue($request['ids'] ?? []) : [$request['id'] ?? ''];
  foreach ($ids as $id) {
    $numericId = intValue($id);
    if ($numericId > 0) supabase('PATCH', 'products?id=eq.' . $numericId, ['deleted_at' => gmdate('c')]);
  }
  respond(['ok' => true]);
}

respond(['error' => 'Accion invalida.'], 422);
