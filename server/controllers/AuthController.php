<?php

require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../utils/JWT.php';

class AuthController {
    private User $userModel;
    
    public function __construct() {
        $this->userModel = new User();
    }
    
    public function login(): void {
        try {
            $jsonData = file_get_contents('php://input');
            $data = json_decode($jsonData, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new Exception('Invalid JSON data');
            }

            if (!isset($data['nickname']) || !isset($data['password'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Nickname and password are required']);
                return;
            }

            $user = $this->userModel->getByNickname($data['nickname']);
            if (!$user) {
                http_response_code(401);
                echo json_encode(['error' => 'Invalid nickname or password']);
                return;
            }

            if (!$this->userModel->verifyPassword($data['password'], $user['password_hash'])) {
                http_response_code(401);
                echo json_encode(['error' => 'Invalid nickname or password']);
                return;
            }

            $this->userModel->updateLastSeen($user['id']);
            unset($user['password_hash']);

            $token = JWT::generate([
                'user_id' => $user['id'],
                'nickname' => $user['nickname']
            ]);

            echo json_encode([
                'token' => $token,
                'user' => $user
            ]);

        } catch (Exception $e) {
            error_log('Error in login: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Internal server error']);
        }
    }
    
    public function register(): void {
        try {
            // Validate required fields
            $requiredFields = ['nickname', 'password', 'confirmPassword', 'birthDate'];
            foreach ($requiredFields as $field) {
                if (!isset($_POST[$field]) || empty($_POST[$field])) {
                    http_response_code(400);
                    echo json_encode(['error' => "Missing required field: $field"]);
                    return;
                }
            }
            
            // Password validation
            if ($_POST['password'] !== $_POST['confirmPassword']) {
                http_response_code(400);
                echo json_encode(['error' => 'Passwords do not match']);
                return;
            }

            if (strlen($_POST['password']) < 6) {
                http_response_code(400);
                echo json_encode(['error' => 'Password must be at least 6 characters long']);
                return;
            }

            if (!preg_match('/[A-Z]/', $_POST['password'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Password must contain at least one uppercase letter']);
                return;
            }

            if (!preg_match('/[0-9]/', $_POST['password'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Password must contain at least one number']);
                return;
            }

            if (!preg_match('/^[a-zA-Z0-9]+$/', $_POST['password'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Password can only contain Latin letters and numbers']);
                return;
            }

            // Age validation
            $birthDateTime = new DateTime($_POST['birthDate']);
            $now = new DateTime();
            $age = $now->diff($birthDateTime)->y;
            
            if ($age < 14) {
                http_response_code(400);
                echo json_encode(['error' => 'You must be at least 14 years old']);
                return;
            }
            
            // Nickname validation
            if (strlen($_POST['nickname']) < 3) {
                http_response_code(400);
                echo json_encode(['error' => 'Nickname must be at least 3 characters long']);
                return;
            }

            if ($this->userModel->getByNickname($_POST['nickname'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Nickname is already taken']);
                return;
            }

            // Handle avatar upload
            $avatarPath = null;
            if (isset($_FILES['avatar']) && $_FILES['avatar']['error'] === UPLOAD_ERR_OK) {
                $file = $_FILES['avatar'];
                $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
                
                if (!in_array($file['type'], $allowedTypes)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Invalid file type. Only JPG, PNG and GIF are allowed']);
                    return;
                }

                $uploadDir = __DIR__ . '/../uploads/avatars/';
                if (!file_exists($uploadDir)) {
                    mkdir($uploadDir, 0777, true);
                }

                $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
                $fileName = uniqid('avatar_') . '.' . $extension;
                $targetPath = $uploadDir . $fileName;

                if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
                    throw new Exception('Failed to move uploaded file');
                }

                $avatarPath = '/uploads/avatars/' . $fileName;
            }

            // Create user
            $userId = $this->userModel->create([
                'nickname' => $_POST['nickname'],
                'password' => password_hash($_POST['password'], PASSWORD_DEFAULT),
                'birth_date' => $_POST['birthDate'],
                'bio' => $_POST['bio'] ?? null,
                'avatar_path' => $avatarPath
            ]);

            if (!$userId) {
                throw new Exception('Failed to create user');
            }

            // Get created user data
            $user = $this->userModel->getById($userId);
            if (!$user) {
                throw new Exception('Failed to retrieve created user');
            }
            
            // Generate token
            $token = JWT::generate([
                'user_id' => $user['id'],
                'nickname' => $user['nickname']
            ]);
            
            http_response_code(201);
            echo json_encode([
                'token' => $token,
                'user' => $user
            ]);

        } catch (Exception $e) {
            error_log('Error in register: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Internal server error']);
        }
    }
}
