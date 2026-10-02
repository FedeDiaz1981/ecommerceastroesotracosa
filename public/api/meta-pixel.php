<?php
require __DIR__ . '/_bootstrap.php';
if ($_SERVER['REQUEST_METHOD'] !== 'GET') respond(['error' => 'Method not allowed'], 405);
respond(['pixelId' => setting('meta_pixel_id')]);
