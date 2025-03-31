<?php
header('Content-Type: application/json');

// Проверяем метод запроса
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['error' => 'Метод не разрешен']);
    exit;
}

// Получаем и проверяем токен авторизации
require_once __DIR__ . '/../../utils/auth.php';
$user = authenticate();

if (!$user) {
    http_response_code(401); // Unauthorized
    echo json_encode(['error' => 'Необходима авторизация']);
    exit;
}

// Получаем данные из запроса
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// Логируем полученные данные
error_log("[toggle_pin] Received data: " . $json);

if (!isset($data['chat_id']) || !isset($data['is_pinned'])) {
    http_response_code(400); // Bad Request
    echo json_encode(['error' => 'Отсутствуют обязательные параметры']);
    exit;
}

$chatId = (int)$data['chat_id'];
$isPinned = (bool)$data['is_pinned'];
$userId = $user['user_id'];

// Получаем ID папки (по умолчанию 0 - "Все чаты")
$folderId = isset($data['folder_id']) ? (int)$data['folder_id'] : 0;

// Логируем информацию о запросе
error_log("[toggle_pin] Toggle pin for chat $chatId, user $userId, folder $folderId, is_pinned: " . ($isPinned ? 'true' : 'false'));

// Проверяем существование чата и участие пользователя в нем
require_once __DIR__ . '/../../models/Database.php';
$db = Database::getInstance();

try {
    // Начинаем транзакцию
    $db->beginTransaction();

    // Проверяем, что пользователь является участником чата
    $memberSql = "SELECT * FROM chat_members WHERE chat_id = ? AND user_id = ?";
    $memberStmt = $db->prepare($memberSql);
    $memberStmt->execute([$chatId, $userId]);
    $memberRecord = $memberStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$memberRecord) {
        // Пользователь не является участником чата
        error_log("[toggle_pin] User $userId is not a member of chat $chatId");
        $db->rollBack();
        http_response_code(403); // Forbidden
        echo json_encode(['error' => 'Вы не являетесь участником этого чата']);
        exit;
    }
    
    // Проверяем, есть ли в записи folders
    $currentFolders = null;
    if (isset($memberRecord['folders']) && $memberRecord['folders']) {
        $currentFolders = json_decode($memberRecord['folders'], true);
    }
    
    // Если нет folders или оно NULL, создаем новый массив с папкой "Все чаты" (ID: 0)
    if (!$currentFolders) {
        $currentFolders = ["0"];
    }
    
    // Проверяем, есть ли указанный folder_id в массиве folders
    $folderIdStr = (string)$folderId;
    if (!in_array($folderIdStr, $currentFolders)) {
        // Добавляем папку в массив, если ее еще нет
        $currentFolders[] = $folderIdStr;
        error_log("[toggle_pin] Adding folder $folderId to chat $chatId for user $userId");
    }
    
    // Обновляем статус закрепления и массив folders
    $updateSql = "UPDATE chat_members SET is_pinned = ?, folders = ? WHERE chat_id = ? AND user_id = ?";
    $updateStmt = $db->prepare($updateSql);
    $foldersJson = json_encode($currentFolders);
    $result = $updateStmt->execute([$isPinned ? 1 : 0, $foldersJson, $chatId, $userId]);
    
    if (!$result) {
        // Не удалось обновить статус
        error_log("[toggle_pin] Failed to update is_pinned: " . json_encode($updateStmt->errorInfo()));
        $db->rollBack();
        http_response_code(500); // Internal Server Error
        echo json_encode(['error' => 'Не удалось изменить статус закрепления чата']);
        exit;
    }
    
    // Если успешно, фиксируем транзакцию
    $db->commit();
    
    // Отправляем успешный ответ
    echo json_encode([
        'success' => true,
        'message' => $isPinned ? 'Чат закреплен' : 'Чат откреплен',
        'is_pinned' => $isPinned
    ]);
    
} catch (Exception $e) {
    // В случае ошибки откатываем изменения
    $db->rollBack();
    error_log("[toggle_pin] Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Не удалось изменить статус закрепления чата']);
}