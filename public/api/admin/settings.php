<?php
require dirname(__DIR__) . '/_bootstrap.php';
requireAdmin();
$key = $_GET['key'] ?? '';
if (!in_array($key, ['mercado_pago_access_token', 'meta_pixel_id'], true)) respond(['error' => 'Configuración inválida.'], 400);
if ($_SERVER['REQUEST_METHOD'] === 'GET') respond(['configured' => setting($key) !== '']);
if ($_SERVER['REQUEST_METHOD'] !== 'PUT') respond(['error' => 'Method not allowed.'], 405);
$value = trim((string)(body()['value'] ?? ''));
if ($key === 'meta_pixel_id' && !preg_match('/^\d{5,20}$/', $value)) respond(['error' => 'El ID del píxel debe contener solo números.'], 400);
if ($key === 'mercado_pago_access_token' && !preg_match('/^(APP_USR|TEST)-/', $value)) respond(['error' => 'El Access Token no es válido.'], 400);
saveSetting($key, $value); respond(['ok' => true]);
