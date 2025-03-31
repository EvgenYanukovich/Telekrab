<?php
/**
 * API для удаления чата
 * POST /chats/delete
 * Данные: chat_id
 */

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../../models/Chat.php';
require_once __DIR__ . '/../../models/Auth.php';

// Проверяем метод запроса
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Метод не разрешен']);
    exit;
}

// Проверяем авторизацию
$auth = new Auth();
$user = $auth->authenticate();

if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Необходима авторизация']);
    exit;
}

// Получаем данные запроса
$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['chat_id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Необходимо указать chat_id']);
    exit;
}

$chatId = (int)$data['chat_id'];

// Удаляем чат
$chat = new Chat();
$result = $chat->deleteChat($chatId, $user['user_id']);

if ($result) {
    echo json_encode([
        'success' => true,
        'message' => 'Чат успешно удален',
        'chat_id' => $chatId
    ]);
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Не удалось удалить чат']);
}
