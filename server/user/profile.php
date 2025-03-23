<?php

require_once __DIR__ . '/../controllers/UserController.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

// Обрабатываем CORS
AuthMiddleware::handleCORS();

// Создаем экземпляр контроллера и вызываем метод для получения профиля
$controller = new UserController();
$controller->getProfile();
