<?php
require __DIR__ . '/_bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') respond(['error' => 'Method not allowed.'], 405);

[$status, $rows] = supabase('GET', 'products?deleted_at=is.null&select=id,sort_order,sku,name,detail,presentation,category_id,category_name,category_ids,category_names,brand,vegano,kosher,testeado_en_animales,public_price,member_price,cash_price,offer_price,offer_mode,offer_weekdays,offer_start_date,offer_end_date,measures,installment_count,interest_free_installments,image,images,fabric_ids,related_product_ids,only_members,status,featured,featured_priority,trending,stock,views_count,sales_count,description,source_section,template_row_map,created_at,updated_at&order=sort_order.asc,id.asc');
if ($status < 200 || $status >= 300 || !is_array($rows)) respond(['error' => 'No se pudo leer el catalogo.'], 502);

$products = array_map(function ($row) {
  return [
    'id' => (int) ($row['id'] ?? 0),
    'sortOrder' => (int) ($row['sort_order'] ?? 0),
    'sku' => (string) ($row['sku'] ?? ''),
    'name' => (string) ($row['name'] ?? ''),
    'detail' => (string) ($row['detail'] ?? ''),
    'presentation' => (string) ($row['presentation'] ?? ''),
    'categoryId' => (int) ($row['category_id'] ?? 0),
    'categoryName' => (string) ($row['category_name'] ?? ''),
    'categoryIds' => $row['category_ids'] ?? [],
    'categoryNames' => $row['category_names'] ?? [],
    'brand' => (string) ($row['brand'] ?? ''),
    'vegano' => (bool) ($row['vegano'] ?? false),
    'kosher' => (bool) ($row['kosher'] ?? false),
    'testeadoEnAnimales' => $row['testeado_en_animales'] ?? null,
    'publicPrice' => (int) ($row['public_price'] ?? 0),
    'memberPrice' => (int) ($row['member_price'] ?? 0),
    'cashPrice' => (int) ($row['cash_price'] ?? 0),
    'offerPrice' => $row['offer_price'] === null ? null : (int) $row['offer_price'],
    'offerMode' => (string) ($row['offer_mode'] ?? 'off'),
    'offerWeekdays' => $row['offer_weekdays'] ?? [],
    'offerStartDate' => $row['offer_start_date'] ?? null,
    'offerEndDate' => $row['offer_end_date'] ?? null,
    'measures' => $row['measures'] ?? [],
    'installmentCount' => (int) ($row['installment_count'] ?? 0),
    'interestFreeInstallments' => $row['interest_free_installments'] ?? [],
    'image' => $row['image'] ?? null,
    'images' => $row['images'] ?? [],
    'fabricIds' => $row['fabric_ids'] ?? [],
    'relatedProductIds' => $row['related_product_ids'] ?? [],
    'onlyMembers' => (bool) ($row['only_members'] ?? false),
    'status' => (string) ($row['status'] ?? 'inactive'),
    'featured' => (bool) ($row['featured'] ?? false),
    'featuredPriority' => $row['featured_priority'] ?? null,
    'trending' => (bool) ($row['trending'] ?? false),
    'stock' => (int) ($row['stock'] ?? 0) > 0 ? (int) $row['stock'] : null,
    'viewsCount' => (int) ($row['views_count'] ?? 0),
    'salesCount' => (int) ($row['sales_count'] ?? 0),
    'description' => $row['description'] ?? null,
    'sourceSection' => $row['source_section'] ?? null,
    'templateRowMap' => $row['template_row_map'] ?? [],
    'createdAt' => $row['created_at'] ?? null,
    'updatedAt' => $row['updated_at'] ?? null,
  ];
}, $rows);

respond(['products' => $products]);
