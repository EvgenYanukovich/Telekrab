<?php
/**
 * API для получения всех чатов пользователя
 * GET /chats/all
 */

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../../models/Chat.php';
require_once __DIR__ . '/../../models/Auth.php';

// Проверяем авторизацию
$auth = new Auth();
$user = $auth->authenticate();

if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// Получаем чаты пользователя
$chat = new Chat();
$chats = $chat->getAllChats($user['id']);

// Возвращаем результат
echo json_encode($chats);
