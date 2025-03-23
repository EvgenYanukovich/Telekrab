<?php

require_once __DIR__ . '/../controllers/UserController.php';

// Создаем экземпляр контроллера
$userController = new UserController();

// Устанавливаем заголовки для CORS и JSON
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Обрабатываем preflight запросы
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Вызываем метод контроллера для обновления профиля
$userController->updateProfile();
