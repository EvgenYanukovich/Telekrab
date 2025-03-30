<?php
/**
 * Настройка CORS-заголовков для API
 * Разрешает кросс-доменные запросы с локальных адресов для разработки
 */

// Разрешаем запросы с любого источника
header('Access-Control-Allow-Origin: *');

// Разрешаем все методы HTTP
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');

// Разрешаем нужные заголовки
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Разрешаем передачу учетных данных (cookies и т.д.)
header('Access-Control-Allow-Credentials: true');

// Устанавливаем время кеширования предварительных запросов (preflight requests)
header('Access-Control-Max-Age: 86400'); // 24 часа

// Обрабатываем предварительные запросы OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // Не нужно ничего обрабатывать, просто вернуть CORS-заголовки
    http_response_code(200);
    exit;
}
