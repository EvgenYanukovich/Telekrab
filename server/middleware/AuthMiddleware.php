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

        if (isset($headers['Authorization'])) {
            $token = str_replace('Bearer ', '', $headers['Authorization']);
        }

        if (!$token) {
            http_response_code(401);
            echo json_encode(['error' => 'No token provided']);
            exit;
        }

        try {
            return JWT::verify($token);
        } catch (Exception $e) {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid token']);
            exit;
        }
    }
}
