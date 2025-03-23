<?php

require_once __DIR__ . '/../utils/JWT.php';

class AuthMiddleware {
    public static function handleCORS(): void {
        // Debug info
        error_log('Request Method: ' . $_SERVER['REQUEST_METHOD']);
        error_log('Content Type: ' . ($_SERVER['CONTENT_TYPE'] ?? 'not set'));
        
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit(0);
        }

        // Разрешаем запросы как с localhost, так и с домена telekrab.org
        $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
        
        // Список разрешенных доменов
        $allowed_origins = [
            'http://localhost',
            'http://localhost:3000',
            'https://telekrab.org',
            'https://www.telekrab.org',
            'https://api.telekrab.org'
        ];
        
        if (in_array($origin, $allowed_origins)) {
            header("Access-Control-Allow-Origin: $origin");
            header('Access-Control-Allow-Credentials: true');
            header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type, Authorization');
        }
    }

    public static function validateToken(): ?array {
        $headers = getallheaders();
        $token = null;

        // Отладочная информация
        error_log('Полученные заголовки: ' . json_encode($headers));

        if (isset($headers['Authorization'])) {
            $token = str_replace('Bearer ', '', $headers['Authorization']);
            error_log('Токен извлечен из заголовка Authorization: ' . substr($token, 0, 10) . '...');
        } else if (isset($headers['authorization'])) {
            // Проверяем с маленькой буквы (некоторые прокси или сервера могут менять регистр)
            $token = str_replace('Bearer ', '', $headers['authorization']);
            error_log('Токен извлечен из заголовка authorization (нижний регистр): ' . substr($token, 0, 10) . '...');
        } else {
            // Проверяем все заголовки на наличие поля Authorization
            error_log('Заголовок Authorization не найден. Доступные заголовки: ' . implode(', ', array_keys($headers)));
        }

        if (!$token) {
            http_response_code(401);
            echo json_encode(['error' => 'No token provided']);
            exit;
        }

        try {
            $decoded = JWT::verify($token);
            error_log('Токен успешно проверен. Пользователь ID: ' . ($decoded['user_id'] ?? 'не указан'));
            return $decoded;
        } catch (Exception $e) {
            error_log('Ошибка при проверке токена: ' . $e->getMessage());
            http_response_code(401);
            echo json_encode(['error' => 'Invalid token']);
            exit;
        }
    }
}
