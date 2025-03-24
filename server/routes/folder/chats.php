<?php
require_once '../../models/Database.php';
require_once '../../models/Folder.php';
require_once '../../utils/auth.php';

// Проверка авторизации
$user = authenticate();

if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Необходима авторизация']);
    exit;
}

// Получение ID папки из запроса
$folderId = isset($_GET['id']) ? (int)$_GET['id'] : null;

if ($folderId === null) {
    http_response_code(400);
    echo json_encode(['error' => 'Не указан ID папки']);
    exit;
}

// Получение чатов из папки
$folder = new Folder();
$chats = $folder->getFolderChats($folderId, $user['user_id']);

// Возвращаем ответ
header('Content-Type: application/json');
echo json_encode($chats);
