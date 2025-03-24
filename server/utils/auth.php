<?php
require_once __DIR__ . '/JWT.php';

/**
 * Аутентификация пользователя через JWT токен
 * 
 * @return array|null Данные пользователя или null в случае неудачи
 */
function authenticate(): ?array {
    // Получаем заголовок авторизации
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    
    // Проверяем наличие токена
    if (empty($authHeader) || !str_starts_with($authHeader, 'Bearer ')) {
        return null;
    }
    
    // Извлекаем токен
    $token = trim(substr($authHeader, 7));
    
    // Проверяем и декодируем токен
    $payload = JWT::verify($token);
    
    // Если токен невалидный или истек срок действия
    if (!$payload || (isset($payload['exp']) && $payload['exp'] < time())) {
        return null;
    }
    
    // Возвращаем данные пользователя из токена
    return [
        'user_id' => $payload['user_id'] ?? null,
        'nickname' => $payload['nickname'] ?? null,
        // Дополнительные поля пользователя можно добавить здесь
    ];
}

/**
 * Проверка доступа пользователя
 * 
 * @param int|null $requiredUserId ID пользователя, который должен быть авторизован
 * @return bool Имеет ли текущий пользователь доступ
 */
function hasAccess(?int $requiredUserId = null): bool {
    $user = authenticate();
    
    if (!$user) {
        return false;
    }
    
    // Если не требуется проверка конкретного пользователя, то доступ разрешен
    if ($requiredUserId === null) {
        return true;
    }
    
    // Проверяем, совпадает ли ID авторизованного пользователя с требуемым
    return $user['user_id'] == $requiredUserId;
}
