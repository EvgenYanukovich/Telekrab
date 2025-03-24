<?php

require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

class UserController {
    private User $userModel;
    
    public function __construct() {
        $this->userModel = new User();
    }
    
    public function getProfile(): void {
        // Проверяем, что метод запроса - GET
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            http_response_code(405);
            echo json_encode(['error' => 'Метод не поддерживается. Используйте GET-запрос для получения профиля.']);
            return;
        }
        
        // Валидируем JWT токен и получаем данные пользователя
        $tokenData = AuthMiddleware::validateToken();
        
        if (!$tokenData || !isset($tokenData['user_id'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Недействительный токен. Пожалуйста, авторизуйтесь заново.']);
            return;
        }
        
        // Получаем ID пользователя из токена
        $userId = $tokenData['user_id'];
        
        // Получаем данные пользователя из БД
        $user = $this->userModel->getById($userId);
        
        if (!$user) {
            http_response_code(404);
            echo json_encode(['error' => 'Пользователь не найден. Возможно, аккаунт был удален.']);
            return;
        }
        
        // Обновляем время последнего посещения
        $this->userModel->updateLastSeen($userId);
        
        // Подготавливаем данные для ответа
        $response = [
            'id' => $user['id'],
            'nickname' => $user['nickname'],
            'birth_date' => $user['birth_date'],
            'bio' => $user['bio'],
            'avatar_url' => $user['avatar_path'],
            'is_private' => (bool)$user['is_private'],
            'last_seen' => $user['last_seen'],
            'is_online' => (bool)$user['is_online'],
            'created_at' => $user['created_at'] ?? null
        ];
        
        // Отправляем ответ
        header('Content-Type: application/json');
        echo json_encode($response);
    }
    
    /**
     * Обновление профиля пользователя
     */
    public function updateProfile(): void {
        // Проверяем, что метод запроса - POST
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Метод не поддерживается. Используйте POST-запрос для обновления профиля.']);
            return;
        }
        
        // Валидируем JWT токен и получаем данные пользователя
        $tokenData = AuthMiddleware::validateToken();
        
        if (!$tokenData || !isset($tokenData['user_id'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Недействительный токен. Пожалуйста, авторизуйтесь заново.']);
            return;
        }
        
        // Получаем ID пользователя из токена
        $userId = $tokenData['user_id'];
        
        // Определяем тип содержимого запроса и получаем данные соответствующим образом
        $contentType = isset($_SERVER['CONTENT_TYPE']) ? $_SERVER['CONTENT_TYPE'] : '';
        
        // Если используется FormData (для загрузки файлов)
        if (strpos($contentType, 'multipart/form-data') !== false) {
            $requestData = $_POST;
        } else {
            // Если это JSON
            $requestData = json_decode(file_get_contents('php://input'), true);
            
            if (!$requestData && json_last_error() !== JSON_ERROR_NONE) {
                http_response_code(400);
                echo json_encode(['error' => 'Неверный формат данных. Ожидается JSON или form-data.']);
                return;
            }
        }
        
        // Проверяем наличие данных для обновления
        $updateData = [];
        
        // Никнейм (должен быть уникальным)
        if (isset($requestData['nickname']) && !empty($requestData['nickname'])) {
            // Проверяем, что никнейм не занят другим пользователем
            $existingUser = $this->userModel->getByNickname($requestData['nickname']);
            if ($existingUser && $existingUser['id'] != $userId) {
                http_response_code(400);
                echo json_encode(['error' => 'Этот никнейм уже занят. Пожалуйста, выберите другой.']);
                return;
            }
            $updateData['nickname'] = $requestData['nickname'];
        }
        
        // Обрабатываем остальные поля
        $fields = ['bio', 'birth_date'];
        foreach ($fields as $field) {
            if (isset($requestData[$field])) {
                $updateData[$field] = $requestData[$field];
            }
        }
        
        // Пароль (если передан)
        if (isset($requestData['password']) && !empty($requestData['password'])) {
            $updateData['password'] = $requestData['password'];
        }
        
        // Обновляем аватар (если передан)
        if (isset($_FILES['avatar']) && $_FILES['avatar']['error'] === UPLOAD_ERR_OK) {
            $avatar = $_FILES['avatar'];
            $avatarPath = $this->saveAvatarFile($avatar);
            
            if ($avatarPath) {
                $updateData['avatar_path'] = $avatarPath;
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Не удалось загрузить аватар. Пожалуйста, попробуйте снова.']);
                return;
            }
        }
        
        // Обновляем данные пользователя
        $success = $this->userModel->update($userId, $updateData);
        
        if ($success) {
            // Получаем обновленные данные пользователя
            $updatedUser = $this->userModel->getById($userId);
            echo json_encode($updatedUser);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Не удалось обновить профиль. Пожалуйста, попробуйте позже.']);
        }
    }

    private function saveAvatarFile($file) {
        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        
        if (!in_array($file['type'], $allowedTypes)) {
            return false;
        }

        $uploadDir = __DIR__ . '/../uploads/avatars/';
        if (!file_exists($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $fileName = uniqid('avatar_') . '.' . $extension;
        $targetPath = $uploadDir . $fileName;

        if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
            return false;
        }

        return '/uploads/avatars/' . $fileName;
    }
}
