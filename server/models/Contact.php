<?php

require_once __DIR__ . '/Database.php';

class Contact {
    private PDO $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    /**
     * Получает список контактов пользователя с информацией о пользователях
     * 
     * @param int $userId ID пользователя
     * @return array Список контактов
     */
    public function getContactsList(int $userId): array {
        try {
            error_log("Запрос контактов для пользователя ID: $userId");
            
            $stmt = $this->db->prepare("
                SELECT c.id, c.contact_id, c.nickname, c.created_at,
                       u.id as user_id, u.nickname as original_nickname, u.bio, u.avatar_path, 
                       u.is_online, u.last_seen 
                FROM contacts c
                JOIN users u ON c.contact_id = u.id
                WHERE c.user_id = :user_id
                ORDER BY c.nickname ASC, u.nickname ASC
            ");
            
            $stmt->execute(['user_id' => $userId]);
            $contacts = $stmt->fetchAll();
            
            error_log("Получено контактов: " . count($contacts));
            return $contacts;
        } catch (PDOException $e) {
            error_log('Failed to get contacts list: ' . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Получает список рекомендуемых пользователей (тех, кого ещё нет в контактах)
     * 
     * @param int $userId ID пользователя
     * @param int $limit Максимальное количество результатов
     * @return array Список рекомендуемых пользователей
     */
    public function getRecommendedUsers(int $userId, int $limit = 10): array {
        try {
            error_log("Запрос рекомендаций для пользователя ID: $userId");
            
            // Проверяем общее количество пользователей в базе
            $userCountStmt = $this->db->query("SELECT COUNT(*) FROM users");
            $totalUsers = $userCountStmt->fetchColumn();
            error_log("Всего пользователей в базе: $totalUsers");
            
            // Проверяем сколько контактов у текущего пользователя
            $contactsStmt = $this->db->prepare("SELECT COUNT(*) FROM contacts WHERE user_id = :user_id");
            $contactsStmt->execute(['user_id' => $userId]);
            $contactsCount = $contactsStmt->fetchColumn();
            error_log("Текущее количество контактов у пользователя: $contactsCount");
            
            // Запрос для получения списка рекомендуемых пользователей с уникальными именами параметров
            $query = "
                SELECT u.id, u.nickname, u.bio, u.avatar_path, u.is_online, u.last_seen
                FROM users u
                WHERE u.id != :user_id_filter 
                AND u.id NOT IN (
                    SELECT contact_id 
                    FROM contacts 
                    WHERE user_id = :user_id_subquery
                )
                ORDER BY u.last_seen DESC
                LIMIT :limit_param
            ";
            
            error_log("SQL запрос: " . $query);
            
            $stmt = $this->db->prepare($query);
            
            $stmt->bindValue(':user_id_filter', $userId, PDO::PARAM_INT);
            $stmt->bindValue(':user_id_subquery', $userId, PDO::PARAM_INT);
            $stmt->bindValue(':limit_param', $limit, PDO::PARAM_INT);
            $stmt->execute();
            
            $recommendations = $stmt->fetchAll();
            error_log("Получено рекомендаций: " . count($recommendations));
            
            // Отладка для каждой рекомендации
            foreach ($recommendations as $rec) {
                error_log("Рекомендация: ID {$rec['id']}, никнейм {$rec['nickname']}");
            }
            
            return $recommendations;
        } catch (PDOException $e) {
            error_log('Failed to get recommended users: ' . $e->getMessage() . " (код: {$e->getCode()})");
            return [];
        }
    }
    
    /**
     * Добавляет пользователя в контакты
     * 
     * @param int $userId ID пользователя
     * @param int $contactId ID пользователя для добавления в контакты
     * @param string|null $nickname Никнейм контакта (опционально)
     * @return bool Успешность операции
     */
    public function addContact(int $userId, int $contactId, ?string $nickname = null): bool {
        try {
            // Проверяем, что не добавляем себя в контакты
            if ($userId === $contactId) {
                return false;
            }
            
            $stmt = $this->db->prepare("
                INSERT INTO contacts (user_id, contact_id, nickname)
                VALUES (:user_id, :contact_id, :nickname)
            ");
            
            return $stmt->execute([
                'user_id' => $userId,
                'contact_id' => $contactId,
                'nickname' => $nickname
            ]);
        } catch (PDOException $e) {
            // Если ошибка связана с дубликатом (контакт уже существует),
            // просто обновляем никнейм
            if ($e->getCode() == '23000') {
                return $this->updateContactNickname($userId, $contactId, $nickname);
            }
            
            error_log('Failed to add contact: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Обновляет никнейм контакта
     * 
     * @param int $userId ID пользователя
     * @param int $contactId ID контакта
     * @param string $nickname Новый никнейм
     * @return bool Успешность операции
     */
    public function updateContactNickname(int $userId, int $contactId, string $nickname): bool {
        $stmt = $this->db->prepare("
            UPDATE contacts 
            SET nickname = ? 
            WHERE user_id = ? AND contact_id = ?
        ");
        $stmt->bindValue(1, $nickname, PDO::PARAM_STR);
        $stmt->bindValue(2, $userId, PDO::PARAM_INT);
        $stmt->bindValue(3, $contactId, PDO::PARAM_INT);
        return $stmt->execute();
    }
    
    /**
     * Удаляет контакт
     * 
     * @param int $userId ID пользователя
     * @param int $contactId ID контакта
     * @return bool Успешность операции
     */
    public function removeContact(int $userId, int $contactId): bool {
        try {
            $stmt = $this->db->prepare("
                DELETE FROM contacts
                WHERE user_id = :user_id AND contact_id = :contact_id
            ");
            
            return $stmt->execute([
                'user_id' => $userId,
                'contact_id' => $contactId
            ]);
        } catch (PDOException $e) {
            error_log('Failed to remove contact: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Получает информацию о контакте
     * 
     * @param int $userId ID пользователя
     * @param int $contactId ID контакта
     * @return array|false Данные контакта или false если контакт не найден
     */
    public function getContact(int $userId, int $contactId): array|false {
        try {
            $stmt = $this->db->prepare("
                SELECT c.*, u.nickname as original_nickname
                FROM contacts c
                JOIN users u ON c.contact_id = u.id
                WHERE c.user_id = :user_id AND c.contact_id = :contact_id
            ");
            
            $stmt->execute([
                'user_id' => $userId,
                'contact_id' => $contactId
            ]);
            
            return $stmt->fetch();
        } catch (PDOException $e) {
            error_log('Failed to get contact: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Поиск контактов пользователя по запросу
     * Поиск производится по ID, оригинальному никнейму и никнейму, установленному пользователем
     * 
     * @param int $userId ID пользователя, чьи контакты ищем
     * @param string $query Поисковый запрос
     * @return array Найденные контакты, отсортированные по релевантности
     */
    public function searchContacts(int $userId, string $query): array {
        // Отладочная информация
        error_log("searchContacts вызван: userId=$userId, query=$query");
        
        try {
            // Очень простой запрос для отладки
            $contains = "%$query%";
            $numericId = is_numeric($query) ? (int)$query : 0;
            
            error_log("Параметры поиска: numericId=$numericId, contains=$contains");
            
            $sql = "
                SELECT 
                    c.contact_id, 
                    c.nickname,
                    u.nickname AS original_nickname,
                    u.bio,
                    u.avatar_path,
                    u.is_online,
                    u.last_seen,
                    u.created_at
                FROM contacts c
                JOIN users u ON c.contact_id = u.id
                WHERE c.user_id = ? AND (
                    c.contact_id = ? OR
                    c.nickname LIKE ? OR
                    u.nickname LIKE ?
                )
                ORDER BY 
                    CASE WHEN c.contact_id = ? THEN 1 ELSE 2 END,
                    u.is_online DESC, 
                    u.last_seen DESC
            ";
            
            error_log("SQL запрос searchContacts: " . $sql);
            
            // Подготавливаем и выполняем запрос
            $stmt = $this->db->prepare($sql);
            $stmt->execute([$userId, $numericId, $contains, $contains, $numericId]);
            
            // Получаем результаты
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            error_log("Найдено контактов: " . count($results));
            return $results;
        } catch (PDOException $e) {
            error_log('Ошибка при поиске контактов: ' . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Поиск пользователей по запросу в глобальном списке (не в контактах)
     * 
     * @param int $userId ID пользователя, который выполняет поиск
     * @param string $query Поисковый запрос
     * @return array Найденные пользователи, отсортированные по релевантности
     */
    public function searchGlobalUsers(int $userId, string $query): array {
        // Отладочная информация
        error_log("searchGlobalUsers вызван: userId=$userId, query=$query");
        
        try {
            // Очень простой запрос для отладки
            $contains = "%$query%";
            $numericId = is_numeric($query) ? (int)$query : 0;
            
            error_log("Параметры глобального поиска: numericId=$numericId, contains=$contains");
            
            $sql = "
                SELECT 
                    u.id, 
                    u.nickname,
                    u.bio,
                    u.avatar_path,
                    u.is_online,
                    u.last_seen
                FROM users u
                LEFT JOIN contacts c ON u.id = c.contact_id AND c.user_id = ?
                WHERE u.id != ? AND c.contact_id IS NULL AND (
                    u.id = ? OR
                    u.nickname LIKE ?
                )
                ORDER BY 
                    CASE WHEN u.id = ? THEN 1 ELSE 2 END,
                    u.is_online DESC, 
                    u.last_seen DESC
                LIMIT 10
            ";
            
            error_log("SQL запрос searchGlobalUsers: " . $sql);
            
            // Подготавливаем и выполняем запрос
            $stmt = $this->db->prepare($sql);
            $stmt->execute([$userId, $userId, $numericId, $contains, $numericId]);
            
            // Получаем результаты
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            error_log("Найдено глобальных пользователей: " . count($results));
            return $results;
        } catch (PDOException $e) {
            error_log('Ошибка при поиске глобальных пользователей: ' . $e->getMessage());
            return [];
        }
    }
}
