<?php
/**
 * API для закрепления/открепления чата
 * POST /chats/pinned
 * Данные: chat_id, is_pinned (true/false)
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

if (!isset($data['chat_id']) || !isset($data['is_pinned'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Необходимо указать chat_id и is_pinned']);
    exit;
}

$chatId = (int)$data['chat_id'];
$isPinned = (bool)$data['is_pinned'];

// Закрепляем/открепляем чат
$chat = new Chat();
$result = $chat->toggleChatPin($chatId, $user['user_id'], $isPinned);

if ($result) {
    echo json_encode([
        'success' => true,
        'message' => $isPinned ? 'Чат закреплен' : 'Чат откреплен',
        'chat_id' => $chatId,
        'is_pinned' => $isPinned
    ]);
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Не удалось изменить статус закрепления чата']);
}
