<?php

require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../utils/JWT.php';

class AuthController {
    private User $userModel;
    
    public function __construct() {
        $this->userModel = new User();
    }
    
    public function login(): void {
        // Проверка метода запроса
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Метод не поддерживается. Используйте POST-запрос для входа в систему.']);
            return;
        }

        // Получение данных из запроса
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);

        // Проверка наличия обязательных полей
        if (!isset($data['nickname']) || !isset($data['password'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Не указаны обязательные поля: никнейм и пароль']);
            return;
        }

        // Поиск пользователя по никнейму
        $user = $this->userModel->getByNickname($data['nickname']);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'Пользователь с указанным никнеймом не найден. Проверьте правильность ввода или зарегистрируйтесь.']);
            return;
        }

        // Проверка пароля
        if (!$this->userModel->verifyPassword($data['password'], $user['password_hash'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Неверный пароль. Пожалуйста, проверьте правильность ввода.']);
            return;
        }

        // Генерация JWT токена
        $token = $this->generateJWT([
            'user_id' => $user['id'],
            'nickname' => $user['nickname'],
            'exp' => time() + 3600 // Токен действителен 1 час
        ]);

        // Подготовка ответа
        $response = [
            'token' => $token,
            'user' => [
                'id' => $user['id'],
                'nickname' => $user['nickname'],
                'avatar_url' => isset($user['avatar_url']) ? $user['avatar_url'] : null,
                'birth_date' => $user['birth_date'],
                'bio' => $user['bio']
            ]
        ];

        // Отправка ответа
        echo json_encode($response);
    }

    public function register(): void {
        // Проверка метода запроса
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Метод не поддерживается. Используйте POST-запрос для регистрации.']);
            return;
        }

        // Получение и валидация данных
        $userData = $this->validateRegistrationData();
        if (empty($userData)) {
            return;
        }

        // Проверка, не занят ли никнейм
        if ($this->userModel->getByNickname($userData['nickname'])) {
            http_response_code(409);
            echo json_encode(['error' => 'Данный никнейм уже занят. Пожалуйста, выберите другой никнейм для регистрации.']);
            return;
        }

        // Сохранение файла аватара, если загружен
        if (isset($_FILES['avatar']) && $_FILES['avatar']['error'] === UPLOAD_ERR_OK) {
            $avatarUrl = $this->saveAvatarFile($_FILES['avatar']);
            if ($avatarUrl) {
                $userData['avatar_url'] = $avatarUrl;
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Не удалось сохранить файл аватара. Проверьте формат (PNG, JPEG, JPG, GIF) и размер файла (не более 5MB).']);
                return;
            }
        }

        // Создание пользователя
        $userId = $this->userModel->create($userData);
        if (!$userId) {
            http_response_code(500);
            echo json_encode(['error' => 'Ошибка при создании пользователя. Пожалуйста, попробуйте позже или обратитесь в службу поддержки.']);
            return;
        }

        // Генерация JWT токена
        $token = $this->generateJWT([
            'user_id' => $userId,
            'nickname' => $userData['nickname'],
            'exp' => time() + 3600 // Токен действителен 1 час
        ]);

        // Получение созданного пользователя
        $user = $this->userModel->getById($userId);

        // Подготовка ответа
        $response = [
            'token' => $token,
            'user' => [
                'id' => $user['id'],
                'nickname' => $user['nickname'],
                'avatar_url' => isset($user['avatar_url']) ? $user['avatar_url'] : null,
                'birth_date' => $user['birth_date'],
                'bio' => $user['bio']
            ]
        ];

        // Отправка ответа
        echo json_encode($response);
    }

    private function validateRegistrationData()
    {
        $contentType = isset($_SERVER['CONTENT_TYPE']) ? $_SERVER['CONTENT_TYPE'] : '';
        $data = [];

        // Обработка multipart/form-data (с файлами)
        if (strpos($contentType, 'multipart/form-data') !== false) {
            $data = $_POST;
        } 
        // Обработка application/json
        else if (strpos($contentType, 'application/json') !== false) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, true) ?? [];
        }

        $errors = [];

        // Валидация никнейма
        if (empty($data['nickname'])) {
            $errors[] = 'Никнейм обязателен для заполнения';
        } else if (strlen($data['nickname']) < 3) {
            $errors[] = 'Никнейм должен содержать минимум 3 символа';
        }

        // Валидация пароля
        if (empty($data['password'])) {
            $errors[] = 'Пароль обязателен для заполнения';
        } else if (strlen($data['password']) < 6) {
            $errors[] = 'Пароль должен содержать минимум 6 символов';
        } else if (!preg_match('/[A-Z]/', $data['password'])) {
            $errors[] = 'Пароль должен содержать хотя бы одну заглавную букву';
        } else if (!preg_match('/[0-9]/', $data['password'])) {
            $errors[] = 'Пароль должен содержать хотя бы одну цифру';
        } else if (!preg_match('/^[a-zA-Z0-9]+$/', $data['password'])) {
            $errors[] = 'Пароль может содержать только латинские буквы и цифры';
        }

        // Валидация даты рождения
        if (empty($data['birthDate'])) {
            $errors[] = 'Дата рождения обязательна для заполнения';
        } else {
            $birthDate = new DateTime($data['birthDate']);
            $today = new DateTime();
            $age = $birthDate->diff($today)->y;
            
            if ($age < 14) {
                $errors[] = 'Вам должно быть не менее 14 лет для регистрации';
            }
        }

        // Если есть ошибки, возвращаем их
        if (!empty($errors)) {
            http_response_code(400);
            // Формируем более подробное сообщение об ошибках
            $errorMessage = 'Ошибки валидации: ' . implode('; ', $errors);
            echo json_encode(['error' => $errorMessage]);
            return [];
        }

        // Если всё ок, возвращаем данные для создания пользователя
        $userData = [
            'nickname' => $data['nickname'],
            'password' => $data['password'],
            'birth_date' => $data['birthDate'],
            'bio' => $data['bio'] ?? null,
        ];

        return $userData;
    }

    private function generateJWT($payload) {
        $secretKey = 'your_secret_key_here';
        $header = [
            'typ' => 'JWT',
            'alg' => 'HS256'
        ];

        $headerJson = json_encode($header);
        $headerBase64 = base64_encode($headerJson);

        $payloadJson = json_encode($payload);
        $payloadBase64 = base64_encode($payloadJson);

        $signature = hash_hmac('sha256', $headerBase64 . '.' . $payloadBase64, $secretKey, true);
        $signatureBase64 = base64_encode($signature);

        $jwt = $headerBase64 . '.' . $payloadBase64 . '.' . $signatureBase64;

        return $jwt;
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
