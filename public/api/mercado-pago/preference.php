<?php
require dirname(__DIR__) . '/_bootstrap.php';
$token = setting('mercado_pago_access_token') ?: ($config['mercado_pago_access_token'] ?? '');
$input = body(); if (!$token || empty($input['items']) || !is_array($input['items'])) respond(['error'=>'Mercado Pago no está configurado o el pedido está vacío.'], 400);
$items=[];
foreach ($input['items'] as $item) {
  if (($item['kind'] ?? 'product') !== 'product') respond(['error'=>'Este tipo de artículo requiere confirmación manual.'], 400);
  $id=(int)($item['id'] ?? 0); $quantity=max(1,(int)($item['quantity'] ?? 1));
  [, $products]=supabase('GET','products?id=eq.'.$id.'&select=name,sku,public_price,measures'); $product=$products[0] ?? null;
  if (!$product) respond(['error'=>'Producto no encontrado.'],404);
  $price=(float)$product['public_price']; foreach (($product['measures'] ?? []) as $measure) if (($measure['id'] ?? '') === ($item['measureId'] ?? '')) $price=(float)($measure['offerPrice'] ?? $measure['publicPrice'] ?? $price);
  $items[]=['title'=>$product['name'],'quantity'=>$quantity,'unit_price'=>$price,'currency_id'=>'ARS'];
}
$request=curl_init('https://api.mercadopago.com/checkout/preferences'); curl_setopt_array($request,[CURLOPT_POST=>true,CURLOPT_RETURNTRANSFER=>true,CURLOPT_POSTFIELDS=>json_encode(['items'=>$items]),CURLOPT_HTTPHEADER=>['Authorization: Bearer '.$token,'Content-Type: application/json']]);
$result=json_decode(curl_exec($request) ?: '{}',true); $status=(int)curl_getinfo($request,CURLINFO_RESPONSE_CODE); curl_close($request);
if ($status >= 300 || empty($result['init_point'])) respond(['error'=>$result['message'] ?? 'No se pudo preparar el pago.'],502);
respond(['preferenceId'=>$result['id'] ?? '', 'checkoutUrl'=>$result['init_point']]);
