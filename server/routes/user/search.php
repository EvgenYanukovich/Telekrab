<?php

require_once __DIR__ . '/../../controllers/SearchController.php';
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
$searchController = new SearchController();

// Отладочная информация
error_log('Метод запроса: ' . $_SERVER['REQUEST_METHOD']);
error_log('Пользователь ID: ' . ($userData['user_id'] ?? 'не определен'));
error_log('URI запроса: ' . $_SERVER['REQUEST_URI']);

// Выбор действия на основе метода запроса
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Проверяем наличие параметра q в запросе
    if (!isset($_GET['q'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Требуется параметр поиска q']);
        exit;
    }
    
    $query = $_GET['q'];
    // Вызываем метод поиска контактов
    $searchController->searchContacts($userData, $query);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Метод не поддерживается для указанного пути.']);
}
