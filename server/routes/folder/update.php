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

// Получение данных из запроса
$data = json_decode(file_get_contents('php://input'), true);

// Проверка наличия данных для обновления
if (empty($data)) {
    http_response_code(400);
    echo json_encode(['error' => 'Нет данных для обновления']);
    exit;
}

// Защита от изменения папки "Все чаты"
if ($folderId === 0) {
    http_response_code(403);
    echo json_encode(['error' => 'Нельзя изменить системную папку']);
    exit;
}

// Обновление папки
$folder = new Folder();
$result = $folder->updateFolder($folderId, $user['user_id'], $data);

if (!$result) {
    http_response_code(404);
    echo json_encode(['error' => 'Папка не найдена или не принадлежит пользователю']);
    exit;
}

// Получаем информацию об обновленной папке
$folders = $folder->getFolders($user['user_id']);
$updatedFolder = null;

foreach ($folders as $folderItem) {
    if ($folderItem['folder_id'] == $folderId) {
        $updatedFolder = $folderItem;
        break;
    }
}

// Возвращаем ответ
header('Content-Type: application/json');
echo json_encode($updatedFolder);
