<?php
/**
 * API для получения контактов, с которыми еще нет чатов
 * GET /chats/contacts
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

// Получаем контакты без чатов
$chat = new Chat();
$contacts = $chat->getContactsWithoutChat($user['id']);

// Возвращаем результат
echo json_encode($contacts);
