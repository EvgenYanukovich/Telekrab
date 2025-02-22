<?php

require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../utils/JWT.php';

class AuthController {
    private User $userModel;
    
    public function __construct() {
        $this->userModel = new User();
    }
    
    public function login(): void {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['nickname']) || !isset($data['password'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Nickname and password are required']);
            return;
        }
        
        $user = $this->userModel->getByNickname($data['nickname']);
        
        if (!$user || !$this->userModel->verifyPassword($data['password'], $user['password_hash'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid credentials']);
            return;
        }
        
        // Обновляем время последнего входа
        $this->userModel->updateLastSeen($user['id']);
        
        // Создаем токен
        $token = JWT::generate([
            'user_id' => $user['id'],
            'nickname' => $user['nickname']
        ]);
        
        // Убираем чувствительные данные
        unset($user['password_hash']);
        
        echo json_encode([
            'token' => $token,
            'user' => $user
        ]);
    }
    
    public function register(): void {
        try {
            error_log('Register method called');
            error_log('POST data: ' . print_r($_POST, true));
            error_log('FILES data: ' . print_r($_FILES, true));

            // Проверяем наличие обязательных полей
            $requiredFields = ['nickname', 'password', 'birthDate'];
            foreach ($requiredFields as $field) {
                if (!isset($_POST[$field]) || empty($_POST[$field])) {
                    error_log("Missing required field: $field");
                    http_response_code(400);
                    echo json_encode(['error' => "Missing required field: $field"]);
                    return;
                }
            }
            
            $nickname = $_POST['nickname'];
            $password = $_POST['password'];
            $birthDate = $_POST['birthDate'];
            $bio = $_POST['bio'] ?? null;
            
            error_log("Nickname: $nickname");
            error_log("Birth date: $birthDate");
            error_log("Bio: $bio");
            
            // Валидация
            if ($password !== $_POST['confirmPassword']) {
                http_response_code(400);
                echo json_encode(['error' => 'Passwords do not match']);
                return;
            }
            
            // Обработка аватара
            $avatarPath = null;
            if (isset($_FILES['avatar']) && $_FILES['avatar']['error'] === UPLOAD_ERR_OK) {
                error_log('Processing avatar upload');
                error_log('Avatar details: ' . print_r($_FILES['avatar'], true));
                
                $uploadDir = __DIR__ . '/../images/avatars/';
                error_log('Upload directory: ' . $uploadDir);
                
                // Создаем директорию, если её нет
                if (!file_exists($uploadDir)) {
                    error_log('Creating avatars directory');
                    if (!mkdir($uploadDir, 0777, true)) {
                        error_log('Failed to create directory: ' . error_get_last()['message']);
                        throw new Exception('Failed to create upload directory');
                    }
                }
                
                // Проверяем права доступа
                if (!is_writable($uploadDir)) {
                    error_log('Upload directory is not writable');
                    throw new Exception('Upload directory is not writable');
                }
                
                // Проверяем тип файла
                $fileInfo = finfo_open(FILEINFO_MIME_TYPE);
                $mimeType = finfo_file($fileInfo, $_FILES['avatar']['tmp_name']);
                finfo_close($fileInfo);
                
                error_log("File mime type: $mimeType");
                
                if (!in_array($mimeType, ['image/jpeg', 'image/png', 'image/gif'])) {
                    error_log('Invalid file type: ' . $mimeType);
                    throw new Exception('Invalid file type. Only JPEG, PNG and GIF are allowed');
                }
                
                // Генерируем имя файла
                $extension = strtolower(pathinfo($_FILES['avatar']['name'], PATHINFO_EXTENSION));
                $fileName = uniqid('avatar_') . '.' . $extension;
                $fullPath = $uploadDir . $fileName;
                $avatarPath = 'images/avatars/' . $fileName;
                
                error_log("Full path for upload: $fullPath");
                
                // Проверяем временный файл
                if (!file_exists($_FILES['avatar']['tmp_name'])) {
                    error_log('Temp file does not exist');
                    throw new Exception('Upload failed: temporary file not found');
                }
                
                if (!is_readable($_FILES['avatar']['tmp_name'])) {
                    error_log('Temp file is not readable');
                    throw new Exception('Upload failed: temporary file not readable');
                }
                
                // Перемещаем файл
                if (!move_uploaded_file($_FILES['avatar']['tmp_name'], $fullPath)) {
                    $error = error_get_last();
                    error_log('Failed to move uploaded file. Error: ' . ($error ? $error['message'] : 'Unknown error'));
                    throw new Exception('Failed to upload avatar');
                }
                
                // Проверяем, что файл создан
                if (!file_exists($fullPath)) {
                    error_log('File was not created after upload');
                    throw new Exception('Failed to verify uploaded file');
                }
                
                error_log('Avatar uploaded successfully to: ' . $fullPath);
            }
            
            // Создаем пользователя
            $userData = [
                'nickname' => $nickname,
                'password' => password_hash($password, PASSWORD_DEFAULT),
                'birth_date' => $birthDate,
                'bio' => $bio,
                'avatar_path' => $avatarPath,
                'is_private' => 0,
                'last_seen' => date('Y-m-d H:i:s')
            ];
            
            error_log('Creating user with data: ' . print_r($userData, true));
            
            $user = $this->userModel->create($userData);
            if (!$user) {
                throw new Exception('Failed to create user in database');
            }
            
            http_response_code(201);
            echo json_encode([
                'message' => 'User created successfully',
                'user' => $user
            ]);
            
        } catch (Exception $e) {
            error_log('Registration error: ' . $e->getMessage());
            error_log('Stack trace: ' . $e->getTraceAsString());
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
}
