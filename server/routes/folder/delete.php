<?php
require_once '../../models/Database.php';
require_once '../../models/Folder.php';
require_once '../../utils/auth.php';
require_once '../../utils/cors.php'; // Подключаем настройки CORS

// Включаем отображение ошибок для отладки
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Если это предварительный запрос OPTIONS, CORS уже обработал его
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

// Проверка авторизации
$user = authenticate();

if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Необходима авторизация']);
    exit;
}

// Получение ID папки из запроса
$folderId = isset($_GET['id']) ? (int)$_GET['id'] : null;

// Логируем для отладки
error_log("Попытка удаления папки с ID: $folderId, пользователь: " . $user['user_id']);

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
echo json_encode(['success' => true]);
