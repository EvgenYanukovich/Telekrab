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
                    is_online
                )
                VALUES (
                    :nickname, 
                    :password_hash, 
                    :birth_date, 
                    :bio, 
                    :avatar_path,
                    :is_private,
                    :last_seen,
                    :is_online
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
                       is_private, last_seen, is_online
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
                       is_private, last_seen, is_online
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
}
