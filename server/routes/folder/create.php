<?php
// Включаем отображение всех ошибок для отладки
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

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

// Получение данных из запроса
$data = json_decode(file_get_contents('php://input'), true);

// Логируем полученные данные для отладки
error_log('Получены данные: ' . json_encode($data));

// Проверка наличия имени папки
if (!isset($data['name']) || empty(trim($data['name']))) {
    http_response_code(400);
    echo json_encode(['error' => 'Необходимо указать название папки']);      
    exit;
}

try {
    // Создание папки
    $folder = new Folder();
    $folderId = $folder->createFolder(
        $user['user_id'],
        $data['name'],
        $data['icon'] ?? '',
        $data['color'] ?? '#2196F3'
    );
    
    error_log('ID созданной папки: ' . var_export($folderId, true));
    
    if (!$folderId) {
        http_response_code(500);
        echo json_encode(['error' => 'Не удалось создать папку']);
        exit;
    }
    
    // Получаем информацию о созданной папке
    $folders = $folder->getFolders($user['user_id']);
    $createdFolder = null;
    
    error_log('Полученные папки: ' . json_encode($folders));
    
    foreach ($folders as $folderItem) {
        if ($folderItem['folder_id'] == $folderId) {
            $createdFolder = $folderItem;
            break;
        }
    }
    
    // Возвращаем ответ
    header('Content-Type: application/json');
    echo json_encode($createdFolder);
} catch (Exception $e) {
    error_log('Ошибка при создании папки: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Не удалось создать папку: ' . $e->getMessage()]);
    exit;
}
