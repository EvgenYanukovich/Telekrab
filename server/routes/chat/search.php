<?php
/**
 * API для поиска чатов
 * GET /chats/search?query=...
 */

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../../models/Chat.php';
require_once __DIR__ . '/../../models/Auth.php';

// Проверяем авторизацию
$auth = new Auth();
$user = $auth->authenticate();

if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Необходима авторизация']);
    exit;
}

// Получаем поисковый запрос
if (!isset($_GET['query']) || empty($_GET['query'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Необходимо указать поисковый запрос']);
    exit;
}

$query = $_GET['query'];

// Ищем чаты
$chat = new Chat();
$chats = $chat->searchChats($query, $user['user_id']);

// Возвращаем результат
echo json_encode($chats);
