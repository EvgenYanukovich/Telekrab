<?php

class Folder {
    private PDO $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    /**
     * Получение списка всех папок пользователя
     * 
     * @param int $userId ID пользователя
     * @return array Список папок
     */
    public function getFolders(int $userId): array {
        try {
            // Получаем пользовательские папки
            $sql = "
                SELECT 
                    uf.id as folder_id, 
                    uf.folder_name as name, 
                    uf.icon,
                    uf.color, 
                    uf.position,
                    uf.created_at
                FROM user_folders uf
                WHERE uf.user_id = ? 
                GROUP BY uf.id
                ORDER BY uf.position ASC, uf.created_at DESC
            ";
            
            $stmt = $this->db->prepare($sql);
            $stmt->execute([$userId]);
            $userFolders = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Логируем для отладки
            error_log('Найденные папки пользователя: ' . json_encode($userFolders));
            
            // Добавляем системную папку "Все чаты"
            $allChatsFolder = [
                'folder_id' => 0,
                'name' => 'Все чаты',
                'icon' => 'folder',  // Можно задать иконку по умолчанию
                'color' => '#2196F3', // Можно задать цвет по умолчанию
                'position' => -1,     // Чтобы всегда была первой
                'created_at' => date('Y-m-d H:i:s')
            ];
            
            // Вставляем в начало массива
            array_unshift($userFolders, $allChatsFolder);
            
            error_log('Возвращаемые папки (включая системную): ' . json_encode($userFolders));
            
            return $userFolders;
        } catch (PDOException $e) {
            error_log('Ошибка при получении папок: ' . $e->getMessage());
            return [
                [
                    'folder_id' => 0,
                    'name' => 'Все чаты',
                    'icon' => 'folder',
                    'color' => '#2196F3',
                    'position' => -1,
                    'created_at' => date('Y-m-d H:i:s')
                ]
            ]; // Возвращаем хотя бы системную папку даже при ошибке
        }
    }
    
    /**
     * Создание новой папки
     * 
     * @param int $userId ID пользователя
     * @param string $name Название папки
     * @param string $icon Иконка папки (опционально)
     * @param string $color Цвет папки (опционально)
     * @return int|false ID созданной папки или false в случае ошибки
     */
    public function createFolder(int $userId, string $name, string $icon = '', string $color = ''): int|false {
        try {
            // Создаем новую папку с позицией 0 (позже можно будет обновить)
            // Вставляем 0 в качестве chat_id - это будет специальная запись только для папки
            $sql = "
                INSERT INTO user_folders (user_id, chat_id, folder_name, icon, color, position, created_at) 
                VALUES (?, 0, ?, ?, ?, 0, NOW())
            ";
            
            $stmt = $this->db->prepare($sql);
            $result = $stmt->execute([$userId, $name, $icon, $color]);
            
            if (!$result) {
                error_log('Ошибка при вставке папки: ' . implode(' ', $stmt->errorInfo()));
                return false;
            }
            
            $folderId = $this->db->lastInsertId();
            
            return $folderId ? (int)$folderId : false;
        } catch (PDOException $e) {
            error_log('Ошибка при создании папки: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
 * Обновление папки
 * 
 * @param int $folderId ID папки
 * @param int $userId ID пользователя (для проверки доступа)
 * @param array $data Данные для обновления (name, icon, color)
 * @return bool Успешно ли обновлена папка
 */
public function updateFolder(int $folderId, int $userId, array $data): bool {
    try {
        $updateFields = [];
        $params = [];
        
        // Формируем список полей для обновления
        if (isset($data['name'])) {
            $updateFields[] = "folder_name = ?";
            $params[] = $data['name'];
        }
        
        if (isset($data['icon'])) {
            $updateFields[] = "icon = ?";
            $params[] = $data['icon'];
        }
        
        if (isset($data['color'])) {
            $updateFields[] = "color = ?";
            $params[] = $data['color'];
        }
        
        if (isset($data['position'])) {
            $updateFields[] = "position = ?";
            $params[] = $data['position'];
        }
        
        if (empty($updateFields)) {
            return true; // Нечего обновлять
        }
        
        // Добавляем параметры для условия WHERE
        $params[] = $folderId;
        $params[] = $userId;
        
        $sql = "
            UPDATE user_folders 
            SET " . implode(", ", $updateFields) . "
            WHERE id = ? AND user_id = ?
        ";
        
        $stmt = $this->db->prepare($sql);
        $result = $stmt->execute($params);
        
        return $result && $stmt->rowCount() > 0;
    } catch (PDOException $e) {
        error_log('Ошибка при обновлении папки: ' . $e->getMessage());
        return false;
    }
}
    
    /**
 * Удаление папки
 * 
 * @param int $folderId ID папки
 * @param int $userId ID пользователя (для проверки доступа)
 * @return bool Успешно ли удалена папка
 */
public function deleteFolder(int $folderId, int $userId): bool {
    try {
        // Логируем входящие данные для отладки
        error_log("Попытка удаления папки. Folder ID: $folderId, User ID: $userId");
        
        // Удаляем папку только если она принадлежит пользователю
        $sql = "DELETE FROM user_folders WHERE id = ? AND user_id = ?";
        
        $stmt = $this->db->prepare($sql);
        $result = $stmt->execute([$folderId, $userId]);
        
        // Логируем результат выполнения запроса
        error_log("Результат удаления: " . ($result ? 'success' : 'failed'));
        error_log("Количество удаленных строк: " . $stmt->rowCount());
        
        // Возвращаем true, если удалена хотя бы одна строка
        return $result && $stmt->rowCount() > 0;
    } catch (PDOException $e) {
        error_log('Ошибка при удалении папки: ' . $e->getMessage());
        return false;
    }
}
    
    /**
     * Добавление чата в папку
     * 
     * @param int $folderId ID папки
     * @param int $chatId ID чата
     * @param int $userId ID пользователя (для проверки доступа)
     * @return bool Успешно ли добавлен чат в папку
     */
    public function addChatToFolder(int $folderId, int $chatId, int $userId): bool {
        try {
            // Проверяем, принадлежит ли папка пользователю
            $folderInfo = $this->getFolderInfo($folderId, $userId);
            
            if (!$folderInfo) {
                return false; // Папка не принадлежит пользователю
            }
            
            // Добавляем чат в папку
            $sql = "
                INSERT INTO user_folders (user_id, chat_id, folder_name, created_at) 
                VALUES (?, ?, ?, NOW())
            ";
            
            $stmt = $this->db->prepare($sql);
            $stmt->execute([$userId, $chatId, $folderInfo['name']]);
            
            return true;
        } catch (PDOException $e) {
            error_log('Ошибка при добавлении чата в папку: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Получение информации о папке
     * 
     * @param int $folderId ID папки
     * @param int $userId ID пользователя (для проверки доступа)
     * @return array|false Информация о папке или false в случае ошибки
     */
    private function getFolderInfo(int $folderId, int $userId): array|false {
        try {
            $sql = "
                SELECT id, folder_name as name, icon, color, position
                FROM user_folders 
                WHERE id = ? AND user_id = ?
                LIMIT 1
            ";
            
            $stmt = $this->db->prepare($sql);
            $stmt->execute([$folderId, $userId]);
            
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log('Ошибка при получении информации о папке: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Удаление чата из папки
     * 
     * @param int $folderId ID папки (не используется, нужно имя папки)
     * @param int $chatId ID чата
     * @param int $userId ID пользователя (для проверки доступа)
     * @return bool Успешно ли удален чат из папки
     */
    public function removeChatFromFolder(int $folderId, int $chatId, int $userId): bool {
        try {
            // Проверяем, принадлежит ли папка пользователю
            $folderInfo = $this->getFolderInfo($folderId, $userId);
            
            if (!$folderInfo) {
                return false; // Папка не принадлежит пользователю
            }
            
            // Удаляем чат из папки
            $sql = "DELETE FROM user_folders WHERE user_id = ? AND chat_id = ? AND folder_name = ?";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([$userId, $chatId, $folderInfo['name']]);
            
            return true;
        } catch (PDOException $e) {
            error_log('Ошибка при удалении чата из папки: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Получение чатов в папке
     * 
     * @param int $folderId ID папки
     * @param int $userId ID пользователя (для проверки доступа)
     * @return array Список чатов в папке
     */
    public function getChatsByFolder(int $folderId, int $userId): array {
        try {
            // Проверяем, принадлежит ли папка пользователю
            $folderInfo = $this->getFolderInfo($folderId, $userId);
            
            if (!$folderInfo) {
                return []; // Папка не принадлежит пользователю
            }
            
            // Получаем все чаты в папке
            $sql = "
                SELECT c.* 
                FROM chats c
                JOIN user_folders uf ON c.id = uf.chat_id
                WHERE uf.user_id = ? AND uf.folder_name = ?
                ORDER BY c.updated_at DESC
            ";
            
            $stmt = $this->db->prepare($sql);
            $stmt->execute([$userId, $folderInfo['name']]);
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log('Ошибка при получении чатов в папке: ' . $e->getMessage());
            return [];
        }
    }
}
