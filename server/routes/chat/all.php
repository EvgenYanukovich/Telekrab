<?php
/**
 * API для получения всех чатов пользователя
 * GET /chats/all
 */

header('Content-Type: application/json; charset=utf-8');

// Проверяем метод запроса
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['error' => 'Метод не разрешен']);
    exit;
}

// Проверяем авторизацию
require_once __DIR__ . '/../../utils/auth.php';
$user = authenticate();

if (!$user) {
    http_response_code(401); // Unauthorized
    echo json_encode(['error' => 'Необходима авторизация']);
    exit;
}

// Получаем ID папки из параметров запроса
// Если папка не указана, используем "Все чаты" по умолчанию
$folderId = isset($_GET['folder_id']) ? (int)$_GET['folder_id'] : 0;

// Подключаемся к базе данных
require_once __DIR__ . '/../../models/Database.php';
$db = Database::getInstance();

error_log("[all_chats] Getting chats for user {$user['user_id']} in folder with ID: $folderId");

try {
    // Получаем список чатов пользователя в указанной папке
    // Используем JSON_CONTAINS для фильтрации по папкам
    
    $sql = "SELECT c.*, 
                  cm.is_pinned,
                  u.nickname as last_sender_name,
                  (SELECT COUNT(*) FROM messages m 
                   WHERE m.chat_id = c.id AND m.sender_id != ?) as unread_count,
                  (SELECT content FROM messages 
                   WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
                  (SELECT created_at FROM messages 
                   WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time,
                  (SELECT sender_id FROM messages 
                   WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_sender_id
            FROM chats c
            JOIN chat_members cm ON c.id = cm.chat_id
            LEFT JOIN users u ON (SELECT sender_id FROM messages 
                                 WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) = u.id
            WHERE cm.user_id = ?";
    
    // Если указана конкретная папка (не "Все чаты"), фильтруем по ней
    if ($folderId !== 0) {
        $sql .= " AND JSON_CONTAINS(cm.folders, '\"$folderId\"')";
    }
    
    // Сортируем чаты по приоритету и времени последнего сообщения
    $sql .= " ORDER BY cm.is_pinned DESC, last_message_time DESC";
    
    $stmt = $db->prepare($sql);
    
    // Используем массив параметров вместо bindParam, чтобы избежать проблем с повторным использованием параметров
    $stmt->execute([$user['user_id'], $user['user_id']]);
    
    $chats = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Обрабатываем результаты для передачи клиенту
    foreach ($chats as &$chatData) {
        // Добавляем дополнительные поля
        
        // Для приватных чатов получаем имя и аватар собеседника
        if (isset($chatData['type']) && $chatData['type'] === 'private') {
            // Ищем собеседника в чате
            $otherUserSql = "SELECT u.nickname, u.avatar_path, u.is_online 
                            FROM chat_members cm 
                            JOIN users u ON cm.user_id = u.id 
                            WHERE cm.chat_id = ? AND cm.user_id != ?";
            
            $otherUserStmt = $db->prepare($otherUserSql);
            $otherUserStmt->execute([$chatData['id'], $user['user_id']]);
            $otherUser = $otherUserStmt->fetch(PDO::FETCH_ASSOC);
            
            if ($otherUser) {
                $chatData['name'] = $otherUser['nickname'];
                $chatData['avatar_path'] = $otherUser['avatar_path'];
                $chatData['isOnline'] = (bool)$otherUser['is_online'];
            }
        }
        
        // Исправляем пути к аватарам для предотвращения двойных слешей
        if (isset($chatData['avatar_path']) && $chatData['avatar_path']) {
            // Убираем двойные слеши в путях
            $chatData['avatar_path'] = str_replace('//', '/', $chatData['avatar_path']);
            
            // Добавляем базовый URL к путям
            $chatData['avatar_path'] = "https://api.telekrab.org".$chatData['avatar_path'];
        }
    }
    
    // Возвращаем результат с JSON_UNESCAPED_SLASHES для предотвращения экранирования слешей
    echo json_encode($chats, JSON_UNESCAPED_SLASHES);
    
} catch (Exception $e) {
    error_log("[all_chats] Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Ошибка при получении чатов']);
}
