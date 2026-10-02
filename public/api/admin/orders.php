<?php
require dirname(__DIR__) . '/_bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') respond(['error' => 'Method not allowed.'], 405);
requireAdmin();

$tables = [
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

$orders = [];
foreach ($tables as $key => $definition) {
  [$status, $rows] = supabase('GET', $definition['relation'] . '?select=id&order=' . $definition['column'] . '.asc,id.asc');
  if ($status >= 200 && $status < 300 && is_array($rows)) $orders[$key] = array_map(fn($row) => (string) ($row['id'] ?? ''), $rows);
}

respond(['orders' => $orders]);
