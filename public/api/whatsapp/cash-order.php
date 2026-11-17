<?php
declare(strict_types=1);

require dirname(__DIR__) . '/_bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(['error' => 'Method not allowed.'], 405);

// This endpoint is intentionally server-side only: the WhatsApp token and seller number
// must never be exposed to the browser. The template must be approved in Meta Business Manager.
$request = body();
$customer = is_array($request['customer'] ?? null) ? $request['customer'] : [];
$items = is_array($request['items'] ?? null) ? $request['items'] : [];
$reference = strtoupper(trim((string) ($request['reference'] ?? '')));

if (!preg_match('/^CASH-[A-Z0-9-]{8,40}$/', $reference)) respond(['error' => 'Referencia de pedido invalida.'], 422);
if (trim((string) ($customer['name'] ?? '')) === '' || !filter_var($customer['email'] ?? '', FILTER_VALIDATE_EMAIL)) {
  respond(['error' => 'Los datos del cliente no son validos.'], 422);
}
if (trim((string) ($customer['phone'] ?? '')) === '') respond(['error' => 'Falta el telefono del cliente.'], 422);
if (count($items) < 1 || count($items) > 50) respond(['error' => 'El pedido no tiene un detalle valido.'], 422);

[, $existingRows] = supabase('GET', 'cash_orders?reference=eq.' . rawurlencode($reference) . '&select=reference,whatsapp_status&limit=1');
if (!empty($existingRows[0])) respond(['ok' => true, 'alreadySent' => true, 'reference' => $reference]);

$safeItems = [];
$total = 0.0;
foreach ($items as $item) {
  if (!is_array($item)) respond(['error' => 'Detalle de pedido invalido.'], 422);
  $name = trim((string) ($item['name'] ?? ''));
  $sku = trim((string) ($item['sku'] ?? ''));
  $quantity = (int) ($item['quantity'] ?? 0);
  $unitPrice = (float) ($item['unitPrice'] ?? 0);
  if ($name === '' || $sku === '' || $quantity < 1 || $quantity > 999 || $unitPrice < 0 || $unitPrice > 1000000000) {
    respond(['error' => 'Uno de los productos del pedido no es valido.'], 422);
  }

  $lineTotal = $unitPrice * $quantity;
  $total += $lineTotal;
  $safeItems[] = [
    'sku' => mb_substr($sku, 0, 80),
    'name' => mb_substr($name, 0, 180),
    'measure' => mb_substr(trim((string) ($item['measureLabel'] ?? '')), 0, 120),
    'quantity' => $quantity,
    'unitPrice' => $unitPrice,
    'lineTotal' => $lineTotal,
  ];
}

$total = round($total, 2);
$itemsText = [];
foreach ($safeItems as $item) {
  $measure = $item['measure'] !== '' ? ' (' . $item['measure'] . ')' : '';
  $itemsText[] = $item['quantity'] . ' x ' . $item['name'] . $measure . ' — $' . number_format($item['lineTotal'], 0, ',', '.');
}
$detail = mb_substr(implode("\n", $itemsText), 0, 900);
$customerName = mb_substr(trim((string) $customer['name']), 0, 120);
$customerEmail = mb_substr(trim((string) $customer['email']), 0, 160);
$customerPhone = mb_substr(trim((string) $customer['phone']), 0, 50);
$itemCount = array_sum(array_column($safeItems, 'quantity'));

$orderPayload = [
  'reference' => $reference,
  'customer_name' => $customerName,
  'customer_email' => $customerEmail,
  'customer_phone' => $customerPhone,
  'items' => $safeItems,
  'total' => $total,
  'whatsapp_status' => 'pending',
];
[$insertStatus] = supabase('POST', 'cash_orders', $orderPayload);
if ($insertStatus < 200 || $insertStatus >= 300) respond(['error' => 'No se pudo registrar el pedido.'], 502);

$accessToken = setting('whatsapp_access_token') ?: ($config['whatsapp_access_token'] ?? '');
$phoneNumberId = setting('whatsapp_phone_number_id') ?: ($config['whatsapp_phone_number_id'] ?? '');
$sellerPhone = setting('whatsapp_seller_phone') ?: ($config['whatsapp_seller_phone'] ?? '');
$templateName = setting('whatsapp_cash_template_name') ?: ($config['whatsapp_cash_template_name'] ?? 'cash_order_notification');
$templateLanguage = setting('whatsapp_cash_template_language') ?: ($config['whatsapp_cash_template_language'] ?? 'es_AR');
$apiVersion = setting('whatsapp_api_version') ?: ($config['whatsapp_api_version'] ?? 'v27.0');
if (!$accessToken || !$phoneNumberId || !$sellerPhone) {
  supabase('PATCH', 'cash_orders?reference=eq.' . rawurlencode($reference), ['whatsapp_status' => 'failed']);
  respond(['error' => 'WhatsApp Business todavía no está configurado.'], 503);
}

$message = [
  'messaging_product' => 'whatsapp',
  'to' => preg_replace('/\D+/', '', $sellerPhone),
  'type' => 'template',
  'template' => [
    'name' => $templateName,
    'language' => ['code' => $templateLanguage],
    'components' => [[
      'type' => 'body',
      'parameters' => array_map(fn($value) => ['type' => 'text', 'text' => (string) $value], [
        $reference,
        $customerName,
        $customerPhone,
        $customerEmail,
        $detail,
        '$' . number_format($total, 0, ',', '.'),
        (string) $itemCount,
      ]),
    ]],
  ],
];

$curl = curl_init('https://graph.facebook.com/' . rawurlencode($apiVersion) . '/' . rawurlencode($phoneNumberId) . '/messages');
curl_setopt_array($curl, [
  CURLOPT_POST => true,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POSTFIELDS => json_encode($message, JSON_UNESCAPED_UNICODE),
  CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $accessToken, 'Content-Type: application/json'],
]);
$responseBody = curl_exec($curl) ?: '{}';
$status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
curl_close($curl);
$response = json_decode($responseBody, true) ?: [];

if ($status < 200 || $status >= 300 || empty($response['messages'][0]['id'])) {
  supabase('PATCH', 'cash_orders?reference=eq.' . rawurlencode($reference), ['whatsapp_status' => 'failed']);
  respond(['error' => 'WhatsApp no pudo entregar el aviso al vendedor.'], 502);
}

supabase('PATCH', 'cash_orders?reference=eq.' . rawurlencode($reference), [
  'whatsapp_status' => 'sent',
  'whatsapp_message_id' => (string) $response['messages'][0]['id'],
]);
respond(['ok' => true, 'reference' => $reference]);
