<?php

require_once __DIR__ . '/Database.php';

class User {
    private PDO $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    public function create(array $userData): ?int {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO users (
                    nickname, 
                    password_hash, 
                    birth_date, 
                    bio, 
                    avatar_path,
                    is_private,
                    last_seen,
                    is_online,
                    created_at
                )
                VALUES (
                    :nickname, 
                    :password_hash, 
                    :birth_date, 
                    :bio, 
                    :avatar_path,
                    :is_private,
                    :last_seen,
                    :is_online,
                    NOW()
                )
            ");
            
            $params = [
                'nickname' => $userData['nickname'],
                'password_hash' => password_hash($userData['password'], PASSWORD_DEFAULT),
                'birth_date' => $userData['birth_date'],
                'bio' => $userData['bio'] ?? null,
                'avatar_path' => $userData['avatar_path'] ?? null,
                'is_private' => $userData['is_private'] ?? 0,
                'last_seen' => date('Y-m-d H:i:s'),
                'is_online' => 1
            ];
            
            $stmt->execute($params);
            return (int)$this->db->lastInsertId();
            
        } catch (PDOException $e) {
            error_log('Failed to create user: ' . $e->getMessage());
            return null;
        }
    }
    
    public function getByNickname(string $nickname): ?array {
        try {
            $stmt = $this->db->prepare("
                SELECT id, nickname, password_hash, birth_date, bio, avatar_path, 
                       is_private, last_seen, is_online, created_at
                FROM users 
                WHERE nickname = :nickname
            ");
            
            $stmt->execute(['nickname' => $nickname]);
            
            $user = $stmt->fetch();
            return $user ?: null;
        } catch (PDOException $e) {
            return null;
        }
    }
    
    public function getById(int $id): ?array {
        try {
            $stmt = $this->db->prepare("
                SELECT id, nickname, birth_date, bio, avatar_path, 
                       is_private, last_seen, is_online, created_at
                FROM users 
                WHERE id = :id
            ");
            
            $stmt->execute(['id' => $id]);
            
            $user = $stmt->fetch();
            return $user ?: null;
        } catch (PDOException $e) {
            return null;
        }
    }
    
    public function updateLastSeen(int $userId): void {
        try {
            $stmt = $this->db->prepare("
                UPDATE users 
                SET last_seen = CURRENT_TIMESTAMP,
                    is_online = true
                WHERE id = :id
            ");
            
            $stmt->execute(['id' => $userId]);
        } catch (PDOException $e) {
            error_log('Failed to update last seen: ' . $e->getMessage());
        }
    }
    
    public function updateAvatarPath(int $userId, string $avatarPath): void {
        try {
            $stmt = $this->db->prepare("
                UPDATE users 
                SET avatar_path = :avatar_path 
                WHERE id = :user_id
            ");
            
            $stmt->execute([
                'avatar_path' => $avatarPath,
                'user_id' => $userId
            ]);
        } catch (PDOException $e) {
            error_log('Failed to update avatar path: ' . $e->getMessage());
            throw $e;
        }
    }
    
    public function verifyPassword(string $password, string $hash): bool {
        return password_verify($password, $hash);
    }
    
    public function updateProfile(int $userId, array $updateData): bool {
        try {
            $allowedFields = ['bio', 'is_private', 'avatar_path'];
            $updates = [];
            $params = ['user_id' => $userId];
            
            foreach ($allowedFields as $field) {
                if (isset($updateData[$field])) {
                    $updates[] = "$field = :$field";
                    $params[$field] = $updateData[$field];
                }
            }
            
            if (empty($updates)) {
                return false;
            }
            
            $sql = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = :user_id";
            $stmt = $this->db->prepare($sql);
            
            return $stmt->execute($params);
        } catch (PDOException $e) {
            error_log('Failed to update profile: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Обновляет данные пользователя в БД
     * 
     * @param int $id ID пользователя
     * @param array $userData Данные для обновления
     * @return bool Успешно ли обновление
     */
    public function update(int $id, array $userData): bool {
        try {
            // Формируем строку SET для SQL запроса
            $setClause = [];
            $params = ['id' => $id];
            
            // Проходим по всем полям, которые могут быть обновлены
            $allowedFields = [
                'nickname', 'birth_date', 'bio', 'avatar_path', 
                'is_private', 'is_online', 'last_seen'
            ];
            
            foreach ($allowedFields as $field) {
                if (isset($userData[$field])) {
                    $setClause[] = "$field = :$field";
                    $params[$field] = $userData[$field];
                }
            }
            
            // Если передан пароль, хешируем его
            if (isset($userData['password']) && !empty($userData['password'])) {
                $setClause[] = "password_hash = :password_hash";
                $params['password_hash'] = password_hash($userData['password'], PASSWORD_DEFAULT);
            }
            
            // Если нет полей для обновления, возвращаем true
            if (empty($setClause)) {
                return true;
            }
            
            // Выполняем запрос на обновление
            $sql = "UPDATE users SET " . implode(', ', $setClause) . " WHERE id = :id";
            $stmt = $this->db->prepare($sql);
            
            return $stmt->execute($params);
            
        } catch (PDOException $e) {
            error_log('Failed to update user: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Получение списка контактов пользователя
     */
    public function getContacts(int $userId, int $page = 1, int $limit = 20): array {
        try {
            $offset = ($page - 1) * $limit;
            
            $stmt = $this->db->prepare("
                SELECT u.id, u.nickname, u.bio, u.avatar_path, u.last_seen, u.is_online, u.created_at 
                FROM users u
                JOIN contacts c ON u.id = c.contact_id
                WHERE c.user_id = :user_id
                ORDER BY u.nickname
                LIMIT :limit OFFSET :offset
            ");
            
            $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
            
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log('Failed to get contacts: ' . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Получение количества контактов пользователя
     */
    public function getContactsCount(int $userId): int {
        try {
            $stmt = $this->db->prepare("
                SELECT COUNT(*) 
                FROM contacts
                WHERE user_id = :user_id
            ");
            
            $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
            $stmt->execute();
            
            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            error_log('Failed to count contacts: ' . $e->getMessage());
            return 0;
        }
    }
    
    /**
     * Добавление пользователя в контакты
     */
    public function addContact(int $userId, int $contactId): bool {
        try {
            // Проверяем, есть ли уже такой контакт
            $checkStmt = $this->db->prepare("
                SELECT COUNT(*) FROM contacts
                WHERE user_id = :user_id AND contact_id = :contact_id
            ");
            
            $checkStmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
            $checkStmt->bindValue(':contact_id', $contactId, PDO::PARAM_INT);
            $checkStmt->execute();
            
            if ((int)$checkStmt->fetchColumn() > 0) {
                // Контакт уже существует
                return true;
            }
            
            // Добавляем контакт
            $stmt = $this->db->prepare("
                INSERT INTO contacts (user_id, contact_id, created_at)
                VALUES (:user_id, :contact_id, NOW())
            ");
            
            $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
            $stmt->bindValue(':contact_id', $contactId, PDO::PARAM_INT);
            
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log('Failed to add contact: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Удаление пользователя из контактов
     */
    public function removeContact(int $userId, int $contactId): bool {
        try {
            $stmt = $this->db->prepare("
                DELETE FROM contacts
                WHERE user_id = :user_id AND contact_id = :contact_id
            ");
            
            $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
            $stmt->bindValue(':contact_id', $contactId, PDO::PARAM_INT);
            
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log('Failed to remove contact: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Проверка, является ли пользователь контактом
     */
    public function isContact(int $userId, int $contactId): bool {
        try {
            $stmt = $this->db->prepare("
                SELECT COUNT(*) FROM contacts
                WHERE user_id = :user_id AND contact_id = :contact_id
            ");
            
            $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
            $stmt->bindValue(':contact_id', $contactId, PDO::PARAM_INT);
            $stmt->execute();
            
            return (int)$stmt->fetchColumn() > 0;
        } catch (PDOException $e) {
            error_log('Failed to check contact: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Поиск пользователей по никнейму
     */
    public function searchByNickname(string $query, int $page = 1, int $limit = 20): array {
        try {
            $offset = ($page - 1) * $limit;
            $searchTerm = "%$query%";
            
            $stmt = $this->db->prepare("
                SELECT id, nickname, bio, avatar_path, is_private, last_seen, is_online, created_at 
                FROM users
                WHERE nickname LIKE :search_term
                ORDER BY nickname
                LIMIT :limit OFFSET :offset
            ");
            
            $stmt->bindValue(':search_term', $searchTerm, PDO::PARAM_STR);
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
            
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log('Failed to search users: ' . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Подсчет количества пользователей, соответствующих запросу
     */
    public function countUsersByNickname(string $query): int {
        try {
            $searchTerm = "%$query%";
            
            $stmt = $this->db->prepare("
                SELECT COUNT(*) 
                FROM users
                WHERE nickname LIKE :search_term
            ");
            
            $stmt->bindValue(':search_term', $searchTerm, PDO::PARAM_STR);
            $stmt->execute();
            
            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            error_log('Failed to count users: ' . $e->getMessage());
            return 0;
        }
    }
}
