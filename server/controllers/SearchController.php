<?php

require_once __DIR__ . '/../models/Contact.php';
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

class SearchController {
    private Contact $contactModel;
    private User $userModel;
    
    public function __construct() {
        $this->contactModel = new Contact();
        $this->userModel = new User();
    }
    
    /**
     * Поиск контактов и пользователей по запросу
     * 
     * @param array $userData Данные аутентифицированного пользователя
     * @param string $query Поисковый запрос
     */
    public function searchContacts(array $userData, string $query): void {
        // Проверяем метод запроса
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            http_response_code(405);
            echo json_encode(['error' => 'Метод не поддерживается. Используйте GET-запрос.']);
            return;
        }
        
        $userId = $userData['user_id'];
        
        // Отладочная информация
        error_log("Запрос поиска: \"$query\" для пользователя ID: $userId");
        
        // Получаем результаты поиска
        $searchResults = $this->contactModel->searchContacts($userId, $query);
        $globalResults = $this->contactModel->searchGlobalUsers($userId, $query);
        
        // Форматируем результаты поиска для контактов
        $formattedContacts = array_map(function($contact) {
            return [
                'id' => (int)$contact['contact_id'],
                'nickname' => $contact['nickname'] ?: $contact['original_nickname'],
                'original_nickname' => $contact['original_nickname'],
                'bio' => $contact['bio'],
                'avatar_url' => $contact['avatar_path'],
                'is_online' => (bool)$contact['is_online'],
                'last_seen' => $contact['last_seen'],
                'created_at' => $contact['created_at']
            ];
        }, $searchResults);
        
        // Форматируем результаты поиска для глобальных пользователей
        $formattedGlobal = array_map(function($user) {
            return [
                'id' => (int)$user['id'],
                'nickname' => $user['nickname'],
                'bio' => $user['bio'],
                'avatar_url' => $user['avatar_path'],
                'is_online' => (bool)$user['is_online'],
                'last_seen' => $user['last_seen']
            ];
        }, $globalResults);
        
        // Формируем ответ
        $response = [
            'contacts' => $formattedContacts,
            'recommended' => $formattedGlobal
        ];
        
        // Добавляем все необходимые заголовки
        header('Content-Type: application/json');
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        
        // Отправляем ответ
        echo json_encode($response);
    }
}
