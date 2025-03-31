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
$userId = (int)$user['user_id'];

try {
    $db = Database::getInstance();
    
    // Проверяем, входит ли пользователь в чат
    $checkMemberSql = "SELECT * FROM chat_members WHERE chat_id = ? AND user_id = ?";
    $checkMemberStmt = $db->prepare($checkMemberSql);
    $checkMemberStmt->execute([$chatId, $userId]);
    $chatMember = $checkMemberStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$chatMember) {
        http_response_code(403);
        echo json_encode(['error' => 'Вы не являетесь участником этого чата']);
        exit;
    }
    
    // Получаем текущие папки чата
    $currentFolders = $chatMember['folders'] ? json_decode($chatMember['folders'], true) : [];
    
    // Проверяем, есть ли уже такая папка в списке
    if (in_array((string)$folderId, $currentFolders)) {
        // Чат уже в этой папке
        http_response_code(200);
        echo json_encode(['success' => true, 'message' => 'Чат уже находится в этой папке']);
        exit;
    }
    
    // Добавляем ID папки в массив
    $currentFolders[] = (string)$folderId;
    
    // Обновляем запись в БД
    $updateSql = "UPDATE chat_members SET folders = ? WHERE chat_id = ? AND user_id = ?";
    $updateStmt = $db->prepare($updateSql);
    $updateStmt->execute([json_encode($currentFolders), $chatId, $userId]);
    
    // Возвращаем успешный ответ
    http_response_code(200);
    echo json_encode([
        'success' => true, 
        'message' => 'Чат успешно добавлен в папку',
        'folders' => $currentFolders
    ]);
    
} catch (PDOException $e) {
    error_log('Ошибка при добавлении чата в папку: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Ошибка сервера при добавлении чата в папку']);
    exit;
}
