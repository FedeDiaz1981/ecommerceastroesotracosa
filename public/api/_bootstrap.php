<?php
declare(strict_types=1);

$configPath = __DIR__ . '/config.php';
if (!is_file($configPath)) { http_response_code(500); exit('Missing API configuration.'); }
$config = require $configPath;

function body(): array { return json_decode(file_get_contents('php://input') ?: '{}', true) ?: []; }
function respond(array $data, int $status = 200): never { http_response_code($status); header('Content-Type: application/json'); echo json_encode($data); exit; }
function supabase(string $method, string $path, ?array $payload = null): array {
  global $config;
  $curl = curl_init(rtrim($config['supabase_url'], '/') . '/rest/v1/' . ltrim($path, '/'));
  $headers = ['apikey: ' . $config['supabase_service_role_key'], 'Authorization: Bearer ' . $config['supabase_service_role_key'], 'Content-Type: application/json'];
  curl_setopt_array($curl, [CURLOPT_CUSTOMREQUEST => $method, CURLOPT_HTTPHEADER => $headers, CURLOPT_RETURNTRANSFER => true]);
  if ($payload !== null) curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($payload));
  $result = curl_exec($curl); $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE); curl_close($curl);
  return [$status, json_decode($result ?: '[]', true)];
}
function setting(string $key): string { [, $rows] = supabase('GET', 'admin_settings?key=eq.' . rawurlencode($key) . '&select=value'); return $rows[0]['value'] ?? ''; }
function saveSetting(string $key, string $value): void {
  global $config;
  $url = rtrim($config['supabase_url'], '/') . '/rest/v1/admin_settings?on_conflict=key';
  $curl = curl_init($url);
  curl_setopt_array($curl, [CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true, CURLOPT_POSTFIELDS => json_encode(['key' => $key, 'value' => $value]), CURLOPT_HTTPHEADER => ['apikey: ' . $config['supabase_service_role_key'], 'Authorization: Bearer ' . $config['supabase_service_role_key'], 'Content-Type: application/json', 'Prefer: resolution=merge-duplicates']]);
  curl_exec($curl); curl_close($curl);
}

function adminUserId(): string {
  global $config;
  $authorization = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
  if (!preg_match('/^Bearer\s+(.+)$/i', $authorization, $matches)) respond(['error' => 'No autorizado.'], 401);
  $curl = curl_init(rtrim($config['supabase_url'], '/') . '/auth/v1/user');
  curl_setopt_array($curl, [
    CURLOPT_HTTPHEADER => ['apikey: ' . $config['supabase_service_role_key'], 'Authorization: Bearer ' . trim($matches[1])],
    CURLOPT_RETURNTRANSFER => true,
  ]);
  $result = curl_exec($curl); $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE); curl_close($curl);
  $user = json_decode($result ?: '{}', true);
  if ($status < 200 || $status >= 300 || empty($user['id'])) respond(['error' => 'La sesion no es valida.'], 401);
  return (string) $user['id'];
}

function requireAdmin(): void {
  $userId = adminUserId();
  [, $rows] = supabase('GET', 'users?auth_user_id=eq.' . rawurlencode($userId) . '&select=role,active&limit=1');
  $user = $rows[0] ?? [];
  $role = strtolower((string) ($user['role'] ?? ''));
  if (empty($user['active']) || !in_array($role, ['admin', 'administrador'], true)) respond(['error' => 'Se requiere una cuenta administradora.'], 403);
}
