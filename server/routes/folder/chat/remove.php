<?php
require_once '../../../models/Database.php';
require_once '../../../models/Folder.php';
require_once '../../../utils/auth.php';

// Проверка авторизации
$user = authenticate();

if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Необходима авторизация']);
    exit;
}

// Получение данных из запроса
$data = json_decode(file_get_contents('php://input'), true);

// Проверка наличия необходимых параметров
if (!isset($data['folder_id']) || !isset($data['chat_id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Необходимо указать ID папки и ID чата']);
    exit;
}

$folderId = (int)$data['folder_id'];
$chatId = (int)$data['chat_id'];

// Удаление чата из папки
$folder = new Folder();
$result = $folder->removeChatFromFolder($folderId, $chatId, $user['user_id']);

if (!$result) {
    http_response_code(400);
    echo json_encode(['error' => 'Не удалось удалить чат из папки']);
    exit;
}

// Возвращаем успешный ответ
header('Content-Type: application/json');
echo json_encode(['success' => true, 'message' => 'Чат успешно удален из папки']);
