<?php

require_once __DIR__ . '/../../controllers/ContactController.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';

// Обрабатываем CORS
AuthMiddleware::handleCORS();

// Проверяем токен аутентификации
$userData = AuthMiddleware::validateToken();
if (!$userData) {
    http_response_code(401);
    echo json_encode(['error' => 'No token provided']);
    exit;
}

// Определяем, какой метод контроллера нужно вызвать на основе типа запроса
$contactController = new ContactController();

// Получение URI запроса и разбор его на части
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = explode('/', trim($requestUri, '/'));

// Отладочная информация
error_log('Метод запроса: ' . $_SERVER['REQUEST_METHOD']);
error_log('Пользователь ID: ' . ($userData['user_id'] ?? 'не определен'));
error_log('URI запроса: ' . $requestUri);

// Выбор действия на основе метода запроса
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Получение списка контактов
    $contactController->getContacts($userData);
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Добавление нового контакта
    $contactController->addContact($userData);
} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    // Удаление контакта (ID контакта передается в теле запроса)
    $contactController->removeContact($userData);
} elseif ($_SERVER['REQUEST_METHOD'] === 'PATCH') {
    // Обновление никнейма контакта
    $contactController->updateContact($userData);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Метод не поддерживается для указанного пути.']);
}
