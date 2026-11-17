<?php
// Copy this file as config.php on Hostinger. Never commit config.php.
return [
  'supabase_url' => 'https://YOUR_PROJECT.supabase.co',
  'supabase_service_role_key' => 'YOUR_SERVICE_ROLE_KEY',
  'encryption_key' => 'A_LONG_RANDOM_SECRET',
  'mercado_pago_access_token' => 'APP_USR-...',
  // WhatsApp Cloud API: keep these values only on the server.
  'whatsapp_access_token' => 'EAA...',
  'whatsapp_phone_number_id' => '123456789012345',
  'whatsapp_seller_phone' => '54911XXXXXXXX',
  'whatsapp_cash_template_name' => 'cash_order_notification',
  'whatsapp_cash_template_language' => 'es_AR',
  'whatsapp_api_version' => 'v27.0',
];
