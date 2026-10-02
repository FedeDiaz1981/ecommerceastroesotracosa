<?php
require dirname(__DIR__) . '/_bootstrap.php';
$amount = (float)($_GET['amount'] ?? 0);
$token = setting('mercado_pago_access_token') ?: ($config['mercado_pago_access_token'] ?? '');
if ($amount <= 0 || !$token) respond(['error' => 'Mercado Pago no está configurado.'], 503);
$curl = curl_init('https://api.mercadopago.com/v1/payment_methods');
curl_setopt_array($curl, [CURLOPT_RETURNTRANSFER => true, CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $token]]);
$methods = json_decode(curl_exec($curl) ?: '[]', true); curl_close($curl);
$methods = array_values(array_map(fn($m) => ['id'=>$m['id'],'name'=>$m['name'],'paymentTypeId'=>$m['payment_type_id']], array_filter($methods, fn($m) => ($m['status'] ?? '') === 'active')));
$plans = []; $seen = [];
foreach (array_slice(array_filter($methods, fn($m) => in_array($m['paymentTypeId'], ['credit_card','debit_card','prepaid_card'])), 0, 12) as $method) {
  $url = 'https://api.mercadopago.com/v1/payment_methods/installments?amount=' . rawurlencode((string)$amount) . '&payment_method_id=' . rawurlencode($method['id']);
  $request = curl_init($url); curl_setopt_array($request, [CURLOPT_RETURNTRANSFER=>true, CURLOPT_HTTPHEADER=>['Authorization: Bearer '.$token]]);
  $options = json_decode(curl_exec($request) ?: '[]', true); curl_close($request);
  foreach ($options as $option) foreach (($option['payer_costs'] ?? []) as $cost) {
    if (($cost['installments'] ?? 0) < 2) continue;
    $key = $method['id'].'-'.$cost['installments'].'-'.$cost['installment_amount'].'-'.$cost['total_amount']; if (isset($seen[$key])) continue; $seen[$key]=true;
    $plans[]=['paymentMethodId'=>$method['id'],'paymentMethodName'=>$method['name'],'installments'=>(int)$cost['installments'],'installmentAmount'=>(float)$cost['installment_amount'],'totalAmount'=>(float)$cost['total_amount'],'installmentRate'=>(float)($cost['installment_rate'] ?? 0),'message'=>$cost['recommended_message'] ?? ''];
  }
}
respond(['paymentMethods' => $methods, 'installmentPlans' => $plans]);
