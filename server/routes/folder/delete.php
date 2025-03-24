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

if (!$folderId) {
    http_response_code(400);
    echo json_encode(['error' => 'Не указан ID папки']);
    exit;
}

// Защита от удаления папки "Все чаты"
if ($folderId === 0) {
    http_response_code(403);
    echo json_encode(['error' => 'Нельзя удалить системную папку']);
    exit;
}

// Удаление папки
$folder = new Folder();
$result = $folder->deleteFolder($folderId, $user['user_id']);

if (!$result) {
    http_response_code(404);
    echo json_encode(['error' => 'Папка не найдена или не принадлежит пользователю']);
    exit;
}

// Возвращаем успешный ответ
header('Content-Type: application/json');
echo json_encode(['success' => true, 'message' => 'Папка успешно удалена']);
