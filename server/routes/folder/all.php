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

// Получение всех папок пользователя
$folder = new Folder();
$folders = $folder->getFolders($user['user_id']);

// Возвращаем ответ
header('Content-Type: application/json');
echo json_encode($folders);
