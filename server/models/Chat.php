<?php
/**
 * Модель для работы с чатами
 */
class Chat {
    private PDO $db;

    public function __construct() {
        require_once __DIR__ . '/Database.php';
        $this->db = Database::getInstance();
    }

    /**
     * Получает все чаты пользователя
     * 
     * @param int $userId ID пользователя
     * @return array Массив чатов
     */
    public function getAllChats(int $userId): array {
        $sql = "SELECT c.id, c.name, c.avatar_path, c.type, c.owner_id, c.is_active,
                       (SELECT u.is_online FROM users u WHERE u.id = 
                           CASE 
                               WHEN c.type = 'private' THEN 
                                   (SELECT cm2.user_id FROM chat_members cm2 
                                    WHERE cm2.chat_id = c.id AND cm2.user_id != ?) 
                               ELSE NULL 
                           END
                       ) as is_online,
                       (SELECT u.last_seen FROM users u WHERE u.id = 
                           CASE 
                               WHEN c.type = 'private' THEN 
                                   (SELECT cm2.user_id FROM chat_members cm2 
                                    WHERE cm2.chat_id = c.id AND cm2.user_id != ?) 
                               ELSE NULL 
                           END
                       ) as last_seen,
                       (SELECT COUNT(*) FROM user_folders uf WHERE uf.user_id = ? AND uf.chat_id = c.id AND uf.folder_name != 'Все чаты') as in_folder_count,
                       (SELECT COUNT(*) FROM messages msg WHERE msg.chat_id = c.id AND msg.is_deleted = 0) as message_count,
                       (SELECT m.content FROM messages m WHERE m.chat_id = c.id AND m.is_deleted = 0 ORDER BY m.created_at DESC LIMIT 1) as last_message,
                       (SELECT TIME_FORMAT(m.created_at, '%H:%i') FROM messages m WHERE m.chat_id = c.id AND m.is_deleted = 0 ORDER BY m.created_at DESC LIMIT 1) as last_message_time,
                       (SELECT COUNT(*) FROM messages m 
                        JOIN message_interactions mi ON m.id = mi.message_id 
                        WHERE m.chat_id = c.id AND mi.user_id = ? AND mi.type = 'status' AND mi.value = 'unread') as unread_count,
                       (SELECT COALESCE(uf.is_pinned, 0) FROM user_folders uf WHERE uf.user_id = ? AND uf.chat_id = c.id LIMIT 1) as is_pinned
                FROM chats c
                JOIN chat_members cm ON c.id = cm.chat_id
                WHERE cm.user_id = ? AND cm.is_blocked = 0
                ORDER BY 
                        is_pinned DESC, 
                        (SELECT m.created_at FROM messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([$userId, $userId, $userId, $userId, $userId, $userId]);
        
        $chats = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Получаем дополнительную информацию для каждого чата
        foreach ($chats as &$chat) {
            // Для личных чатов получаем информацию о собеседнике
            if ($chat['type'] === 'private') {
                $otherUser = $this->getOtherChatMember($chat['id'], $userId);
                if ($otherUser) {
                    $chat['name'] = $otherUser['nickname'];
                    $chat['avatar_path'] = $otherUser['avatar_path'];
                }
            }

            // Форматируем время последнего сообщения
            if ($chat['last_message_time']) {
                // Если сообщение было отправлено сегодня, оставляем только время
                // Если вчера, пишем "Вчера"
                // Если раньше, указываем дату в формате ДД.ММ
                $messageDate = $this->formatLastMessageTime($chat['last_message_time']);
                $chat['last_message_time'] = $messageDate;
            }
        }
        
        return $chats;
    }

    /**
     * Получает список чатов, которые отображаются в определенной папке
     * 
     * @param string $folderName Название папки
     * @param int $userId ID пользователя
     * @return array Массив чатов
     */
    public function getChatsInFolder(string $folderName, int $userId): array {
        if ($folderName === 'Все чаты') {
            return $this->getAllChats($userId);
        }

        $sql = "SELECT c.id, c.name, c.avatar_path, c.type, c.owner_id, c.is_active,
                       (SELECT u.is_online FROM users u WHERE u.id = 
                           CASE 
                               WHEN c.type = 'private' THEN 
                                   (SELECT cm2.user_id FROM chat_members cm2 
                                    WHERE cm2.chat_id = c.id AND cm2.user_id != ?) 
                               ELSE NULL 
                           END
                       ) as is_online,
                       (SELECT u.last_seen FROM users u WHERE u.id = 
                           CASE 
                               WHEN c.type = 'private' THEN 
                                   (SELECT cm2.user_id FROM chat_members cm2 
                                    WHERE cm2.chat_id = c.id AND cm2.user_id != ?) 
                               ELSE NULL 
                           END
                       ) as last_seen,
                       (SELECT COUNT(*) FROM user_folders uf WHERE uf.user_id = ? AND uf.chat_id = c.id AND uf.folder_name != 'Все чаты') as in_folder_count,
                       (SELECT COUNT(*) FROM messages msg WHERE msg.chat_id = c.id AND msg.is_deleted = 0) as message_count,
                       (SELECT m.content FROM messages m WHERE m.chat_id = c.id AND m.is_deleted = 0 ORDER BY m.created_at DESC LIMIT 1) as last_message,
                       (SELECT TIME_FORMAT(m.created_at, '%H:%i') FROM messages m WHERE m.chat_id = c.id AND m.is_deleted = 0 ORDER BY m.created_at DESC LIMIT 1) as last_message_time,
                       (SELECT COUNT(*) FROM messages m 
                        JOIN message_interactions mi ON m.id = mi.message_id 
                        WHERE m.chat_id = c.id AND mi.user_id = ? AND mi.type = 'status' AND mi.value = 'unread') as unread_count,
                       (SELECT COALESCE(uf2.is_pinned, 0) FROM user_folders uf2 WHERE uf2.user_id = ? AND uf2.chat_id = c.id LIMIT 1) as is_pinned
                FROM chats c
                JOIN chat_members cm ON c.id = cm.chat_id
                JOIN user_folders uf ON c.id = uf.chat_id AND uf.user_id = ? AND uf.folder_name = ?
                WHERE cm.user_id = ? AND cm.is_blocked = 0
                ORDER BY 
                        is_pinned DESC,
                        (SELECT m.created_at FROM messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([$userId, $userId, $userId, $userId, $userId, $userId, $folderName, $userId]);
        
        $chats = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Получаем дополнительную информацию для каждого чата
        foreach ($chats as &$chat) {
            // Для личных чатов получаем информацию о собеседнике
            if ($chat['type'] === 'private') {
                $otherUser = $this->getOtherChatMember($chat['id'], $userId);
                if ($otherUser) {
                    $chat['name'] = $otherUser['nickname'];
                    $chat['avatar_path'] = $otherUser['avatar_path'];
                }
            }

            // Форматируем время последнего сообщения
            if ($chat['last_message_time']) {
                // Форматирование времени
                $messageDate = $this->formatLastMessageTime($chat['last_message_time']);
                $chat['last_message_time'] = $messageDate;
            }
        }
        
        return $chats;
    }

    /**
     * Ищет чаты по имени или содержимому сообщений
     * 
     * @param string $query Поисковый запрос
     * @param int $userId ID пользователя
     * @return array Массив найденных чатов
     */
    public function searchChats(string $query, int $userId): array {
        $searchTerm = "%{$query}%";

        $sql = "SELECT DISTINCT c.id, c.name, c.avatar_path, c.type, c.owner_id, c.is_active,
                       (SELECT u.is_online FROM users u WHERE u.id = 
                           CASE 
                               WHEN c.type = 'private' THEN 
                                   (SELECT cm2.user_id FROM chat_members cm2 
                                    WHERE cm2.chat_id = c.id AND cm2.user_id != ?) 
                               ELSE NULL 
                           END
                       ) as is_online,
                       (SELECT COUNT(*) FROM user_folders uf WHERE uf.user_id = ? AND uf.chat_id = c.id AND uf.folder_name != 'Все чаты') as in_folder_count,
                       (SELECT m.content FROM messages m WHERE m.chat_id = c.id AND m.is_deleted = 0 ORDER BY m.created_at DESC LIMIT 1) as last_message,
                       (SELECT TIME_FORMAT(m.created_at, '%H:%i') FROM messages m WHERE m.chat_id = c.id AND m.is_deleted = 0 ORDER BY m.created_at DESC LIMIT 1) as last_message_time,
                       (SELECT COUNT(*) FROM messages m 
                        JOIN message_interactions mi ON m.id = mi.message_id 
                        WHERE m.chat_id = c.id AND mi.user_id = ? AND mi.type = 'status' AND mi.value = 'unread') as unread_count,
                       0 as is_pinned
                FROM chats c
                JOIN chat_members cm ON c.id = cm.chat_id
                LEFT JOIN messages m ON c.id = m.chat_id
                WHERE cm.user_id = ? AND cm.is_blocked = 0
                AND (
                    c.name LIKE ? OR
                    (
                        c.type = 'private' AND
                        EXISTS (
                            SELECT 1 FROM chat_members cm2
                            JOIN users u ON cm2.user_id = u.id
                            WHERE cm2.chat_id = c.id AND cm2.user_id != ? AND u.nickname LIKE ?
                        )
                    ) OR
                    EXISTS (
                        SELECT 1 FROM messages msg
                        WHERE msg.chat_id = c.id AND msg.content LIKE ?
                    )
                )
                ORDER BY 
                         (SELECT m.created_at FROM messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([$userId, $userId, $userId, $userId, $searchTerm, $userId, $searchTerm, $searchTerm]);
        
        $chats = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Получаем дополнительную информацию для каждого чата
        foreach ($chats as &$chat) {
            // Для личных чатов получаем информацию о собеседнике
            if ($chat['type'] === 'private') {
                $otherUser = $this->getOtherChatMember($chat['id'], $userId);
                if ($otherUser) {
                    $chat['name'] = $otherUser['nickname'];
                    $chat['avatar_path'] = $otherUser['avatar_path'];
                }
            }

            // Форматируем время последнего сообщения
            if ($chat['last_message_time']) {
                $messageDate = $this->formatLastMessageTime($chat['last_message_time']);
                $chat['last_message_time'] = $messageDate;
            }
        }
        
        return $chats;
    }

    /**
     * Создает новый чат между двумя пользователями
     * 
     * @param int $userId ID пользователя, создавшего чат
     * @param int $contactId ID пользователя-собеседника
     * @return int|false ID созданного чата или false в случае ошибки
     */
    public function createPrivateChat(int $userId, int $contactId) {
        // Проверяем, существует ли уже чат между этими пользователями
        $existingChat = $this->getExistingPrivateChat($userId, $contactId);
        if ($existingChat) {
            error_log("Found existing chat: " . $existingChat);
            return $existingChat;
        }

        try {
            error_log("Creating new private chat between $userId and $contactId");
            $this->db->beginTransaction();
            
            // Создаем новый чат
            $chatSql = "INSERT INTO chats (name, type, owner_id, created_at) VALUES (NULL, 'private', ?, NOW())";
            $chatStmt = $this->db->prepare($chatSql);
            $chatStmt->execute([$userId]);
            
            $chatId = $this->db->lastInsertId();
            error_log("Created chat with ID: " . $chatId);
            
            // Добавляем пользователей в чат
            $memberSql = "INSERT INTO chat_members (chat_id, user_id, role, joined_at) VALUES (?, ?, 'member', NOW())";
            $memberStmt = $this->db->prepare($memberSql);
            
            error_log("Adding user $userId to chat");
            $memberStmt->execute([$chatId, $userId]);
            
            error_log("Adding user $contactId to chat");
            $memberStmt->execute([$chatId, $contactId]);
            
            // Добавляем каждый чат в папку "Все чаты" для обоих пользователей, избегая дублирования записей
            try {
                // Добавляем чат для первого пользователя
                error_log("Adding chat to 'All Chats' folder for user $userId");
                $folder1Sql = "INSERT INTO user_folders (user_id, chat_id, folder_name, created_at) VALUES (?, ?, 'Все чаты', NOW())";
                $folder1Stmt = $this->db->prepare($folder1Sql);
                $folder1Stmt->execute([$userId, $chatId]);
            } catch (Exception $e) {
                error_log("Warning (expected): " . $e->getMessage());
                // Продолжаем выполнение, так как ошибка ожидаема из-за ограничения уникальности в таблице user_folders
            }

            try {
                // Добавляем чат для второго пользователя
                error_log("Adding chat to 'All Chats' folder for user $contactId");
                $folder2Sql = "INSERT INTO user_folders (user_id, chat_id, folder_name, created_at) VALUES (?, ?, 'Все чаты', NOW())";
                $folder2Stmt = $this->db->prepare($folder2Sql);
                $folder2Stmt->execute([$contactId, $chatId]);
            } catch (Exception $e) {
                error_log("Warning (expected): " . $e->getMessage());
                // Продолжаем выполнение, так как ошибка ожидаема из-за ограничения уникальности в таблице user_folders
            }

            $this->db->commit();
            error_log("Chat creation successful, returning chatId: " . $chatId);
            return $chatId;
        } catch (Exception $e) {
            $this->db->rollBack();
            error_log("Error creating chat: " . $e->getMessage() . "\nTrace: " . $e->getTraceAsString());
            return false;
        }
    }

    /**
     * Проверяет существование личного чата между двумя пользователями
     * 
     * @param int $userId Первый пользователь
     * @param int $contactId Второй пользователь
     * @return int|false ID существующего чата или false, если чат не найден
     */
    public function getExistingPrivateChat(int $userId, int $contactId) {
        $sql = "SELECT cm1.chat_id
                FROM chat_members cm1
                JOIN chat_members cm2 ON cm1.chat_id = cm2.chat_id
                JOIN chats c ON cm1.chat_id = c.id
                WHERE cm1.user_id = ? AND cm2.user_id = ? AND c.type = 'private'
                AND cm1.is_blocked = 0 AND cm2.is_blocked = 0
                LIMIT 1";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$userId, $contactId]);
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ? $result['chat_id'] : false;
    }

    /**
     * Получает непрочитанные чаты пользователя
     * 
     * @param int $userId ID пользователя
     * @return array Массив чатов с непрочитанными сообщениями
     */
    public function getUnreadChats(int $userId): array {
        $sql = "SELECT c.id, c.name, c.avatar_path, c.type,
                       (SELECT COUNT(*) FROM messages m 
                        JOIN message_interactions mi ON m.id = mi.message_id 
                        WHERE m.chat_id = c.id AND mi.user_id = ? AND mi.type = 'status' AND mi.value = 'unread') as unread_count
                FROM chats c
                JOIN chat_members cm ON c.id = cm.chat_id
                WHERE cm.user_id = ? AND cm.is_blocked = 0
                HAVING unread_count > 0
                ORDER BY 
                         (SELECT m.created_at FROM messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([$userId, $userId]);
        
        $chats = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Получаем дополнительную информацию для каждого чата
        foreach ($chats as &$chat) {
            // Для личных чатов получаем информацию о собеседнике
            if ($chat['type'] === 'private') {
                $otherUser = $this->getOtherChatMember($chat['id'], $userId);
                if ($otherUser) {
                    $chat['name'] = $otherUser['nickname'];
                    $chat['avatar_path'] = $otherUser['avatar_path'];
                }
            }
        }
        
        return $chats;
    }
    

    /**
     * Удаляет чат (для личных чатов просто удаляет пользователя из участников)
     * 
     * @param int $chatId ID чата
     * @param int $userId ID пользователя
     * @return bool Успешно ли выполнена операция
     */
    public function deleteChat(int $chatId, int $userId): bool {
        try {
            $this->db->beginTransaction();
            
            // Получаем информацию о чате
            $chatSql = "SELECT type, owner_id FROM chats WHERE id = ?";
            $chatStmt = $this->db->prepare($chatSql);
            $chatStmt->execute([$chatId]);
            $chat = $chatStmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$chat) {
                $this->db->rollBack();
                return false;
            }
            
            // Для личных чатов и если пользователь владелец - удаляем чат полностью
            if ($chat['type'] === 'private' || $chat['owner_id'] == $userId) {
                // Удаляем все сообщения и их взаимодействия
                $interactionSql = "DELETE mi FROM message_interactions mi 
                                   JOIN messages m ON mi.message_id = m.id 
                                   WHERE m.chat_id = ?";
                $interactionStmt = $this->db->prepare($interactionSql);
                $interactionStmt->execute([$chatId]);
                
                $messageSql = "DELETE FROM messages WHERE chat_id = ?";
                $messageStmt = $this->db->prepare($messageSql);
                $messageStmt->execute([$chatId]);
                
                // Удаляем чат из папок всех пользователей
                $folderSql = "DELETE FROM user_folders WHERE chat_id = ?";
                $folderStmt = $this->db->prepare($folderSql);
                $folderStmt->execute([$chatId]);
                
                // Удаляем всех участников чата
                $memberSql = "DELETE FROM chat_members WHERE chat_id = ?";
                $memberStmt = $this->db->prepare($memberSql);
                $memberStmt->execute([$chatId]);
                
                // Удаляем сам чат
                $deleteSql = "DELETE FROM chats WHERE id = ?";
                $deleteStmt = $this->db->prepare($deleteSql);
                $deleteStmt->execute([$chatId]);
            }
            // Если пользователь не владелец, просто выходит из чата
            else {
                // Удаляем пользователя из участников чата
                $memberSql = "DELETE FROM chat_members WHERE chat_id = ? AND user_id = ?";
                $memberStmt = $this->db->prepare($memberSql);
                $memberStmt->execute([$chatId, $userId]);
                
                // Удаляем чат из папок пользователя
                $folderSql = "DELETE FROM user_folders WHERE chat_id = ? AND user_id = ?";
                $folderStmt = $this->db->prepare($folderSql);
                $folderStmt->execute([$chatId, $userId]);
            }

            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollBack();
            error_log("Error deleting chat: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Получает информацию о других участниках личного чата
     * 
     * @param int $chatId ID чата
     * @param int $userId ID текущего пользователя
     * @return array|false Информация о собеседнике или false, если не найден
     */
    private function getOtherChatMember(int $chatId, int $userId) {
        $sql = "SELECT u.id, u.nickname, u.avatar_path, u.is_online, u.last_seen
                FROM users u
                JOIN chat_members cm ON u.id = cm.user_id
                WHERE cm.chat_id = ? AND cm.user_id != ?
                LIMIT 1";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$chatId, $userId]);
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Форматирует время последнего сообщения
     * 
     * @param string $time Время в формате HH:MM
     * @return string Отформатированное время
     */
    private function formatLastMessageTime(string $time): string {
        $now = new DateTime();
        $today = $now->format('Y-m-d');
        $yesterday = (new DateTime('yesterday'))->format('Y-m-d');
        
        // Предполагаем, что у нас есть только время, восстанавливаем полную дату из context
        // В реальном коде нужно использовать полную дату из БД
        return $time; // Временно возвращаем только время
    }

    /**
     * Получает список контактов пользователя, с которыми еще нет чата
     * 
     * @param int $userId ID пользователя
     * @return array Массив контактов без чатов
     */
    public function getContactsWithoutChat(int $userId): array {
        $sql = "SELECT u.id, u.nickname, u.avatar_path, u.is_online, u.last_seen, u.bio
                FROM users u
                JOIN contacts c ON u.id = c.contact_id
                WHERE c.user_id = ? AND u.id NOT IN (
                    SELECT cm2.user_id
                    FROM chat_members cm1
                    JOIN chat_members cm2 ON cm1.chat_id = cm2.chat_id
                    JOIN chats ch ON cm1.chat_id = ch.id
                    WHERE cm1.user_id = ? AND cm2.user_id != ? AND ch.type = 'private'
                )
                ORDER BY u.nickname";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$userId, $userId, $userId]);
        
        $contacts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Форматируем данные для отображения на клиенте
        foreach ($contacts as &$contact) {
            // Добавляем URL аватара, если он есть
            if ($contact['avatar_path']) {
                $contact['avatar_path'] = '/images/' . $contact['avatar_path'];
            }
            
            // Добавляем поле name для совместимости с фронтендом
            $contact['name'] = $contact['nickname'];
            
            // Форматируем время последнего посещения
            if (!$contact['is_online'] && $contact['last_seen']) {
                $contact['last_seen_formatted'] = $this->formatLastSeen($contact['last_seen']);
            }
        }
        
        return $contacts;
    }

    /**
     * Форматирует время последнего посещения
     * 
     * @param string $lastSeen Время последнего посещения
     * @return string Отформатированное время
     */
    private function formatLastSeen(string $lastSeen): string {
        $lastSeenDate = new DateTime($lastSeen);
        $now = new DateTime();
        $diff = $now->diff($lastSeenDate);
        
        if ($diff->days > 0) {
            // Если больше суток, возвращаем дату
            return "был(-а) " . $lastSeenDate->format('d.m.Y');
        } else {
            // Иначе возвращаем время
            return "был(-а) в " . $lastSeenDate->format('H:i');
        }
    }
}
