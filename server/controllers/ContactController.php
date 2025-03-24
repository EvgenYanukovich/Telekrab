<?php

require_once __DIR__ . '/../models/Contact.php';
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

class ContactController {
    private Contact $contactModel;
    private User $userModel;
    
    public function __construct() {
        $this->contactModel = new Contact();
        $this->userModel = new User();
    }
    
    /**
     * Получение списка контактов пользователя и рекомендуемых пользователей
     */
    public function getContacts(array $userData): void {
        // Проверяем метод запроса
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            http_response_code(405);
            echo json_encode(['error' => 'Метод не поддерживается. Используйте GET-запрос.']);
            return;
        }
        
        // Данные пользователя уже проверены в маршрутизаторе
        $userId = $userData['user_id'];
        
        // Отладочная информация
        error_log("Получен запрос на контакты для пользователя ID: $userId");
        
        // Получаем список контактов
        $contacts = $this->contactModel->getContactsList($userId);
        
        // Получаем список рекомендуемых пользователей
        $recommendedUsers = $this->contactModel->getRecommendedUsers($userId);
        
        // Дополнительная отладка
        error_log("Список контактов: " . json_encode($contacts));
        error_log("Список рекомендаций: " . json_encode($recommendedUsers));
        
        // Форматируем ответ для контактов
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
        }, $contacts);
        
        // Форматируем ответ для рекомендуемых пользователей
        $formattedRecommendations = array_map(function($user) {
            return [
                'id' => (int)$user['id'],
                'nickname' => $user['nickname'],
                'bio' => $user['bio'],
                'avatar_url' => $user['avatar_path'],
                'is_online' => (bool)$user['is_online'],
                'last_seen' => $user['last_seen']
            ];
        }, $recommendedUsers);
        
        // Формируем ответ
        $response = [
            'contacts' => $formattedContacts,
            'recommended' => $formattedRecommendations
        ];
        
        // Отладка финального ответа
        error_log("Финальный ответ API: " . json_encode($response));
        
        // Добавляем все необходимые заголовки
        header('Content-Type: application/json');
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        
        // Отправляем ответ
        echo json_encode($response);
    }
    
    /**
     * Добавление контакта
     */
    public function addContact(array $userData): void {
        // Проверяем метод запроса
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Метод не поддерживается. Используйте POST-запрос.']);
            return;
        }
        
        $userId = $userData['user_id'];
        
        // Получаем данные из запроса
        $requestData = json_decode(file_get_contents('php://input'), true);
        
        if (!$requestData || !isset($requestData['contact_id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Неверные данные запроса. Требуется contact_id.']);
            return;
        }
        
        $contactId = (int)$requestData['contact_id'];
        $nickname = $requestData['nickname'] ?? null;
        
        // Проверяем, что не добавляем себя в контакты
        if ($userId === $contactId) {
            http_response_code(400);
            echo json_encode(['error' => 'Нельзя добавить себя в контакты.']);
            return;
        }
        
        // Проверяем существование пользователя
        $contactUser = $this->userModel->getById($contactId);
        if (!$contactUser) {
            http_response_code(404);
            echo json_encode(['error' => 'Пользователь не найден.']);
            return;
        }
        
        // Добавляем контакт
        $success = $this->contactModel->addContact($userId, $contactId, $nickname);
        
        if ($success) {
            // Получаем обновленный список контактов
            $contacts = $this->contactModel->getContactsList($userId);
            
            // Находим добавленный контакт
            $addedContact = null;
            foreach ($contacts as $contact) {
                if ((int)$contact['contact_id'] === $contactId) {
                    $addedContact = [
                        'id' => (int)$contact['contact_id'],
                        'nickname' => $contact['nickname'] ?: $contact['original_nickname'],
                        'original_nickname' => $contact['original_nickname'],
                        'bio' => $contact['bio'],
                        'avatar_url' => $contact['avatar_path'],
                        'is_online' => (bool)$contact['is_online'],
                        'last_seen' => $contact['last_seen'],
                        'created_at' => $contact['created_at']
                    ];
                    break;
                }
            }
            
            // Отправляем ответ
            echo json_encode(['success' => true, 'contact' => $addedContact]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Не удалось добавить контакт.']);
        }
    }
    
    /**
     * Удаление контакта
     */
    public function removeContact(array $userData, int $contactId = null): void {
        // Проверяем метод запроса
        if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
            http_response_code(405);
            echo json_encode(['error' => 'Метод не поддерживается. Используйте DELETE-запрос.']);
            return;
        }
        
        $userId = $userData['user_id'];
        
        // Получаем данные из тела запроса DELETE
        $requestData = json_decode(file_get_contents('php://input'), true);
        
        // Проверяем наличие contact_id в запросе
        if (!$requestData || !isset($requestData['contact_id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Неверные данные запроса. Требуется contact_id.']);
            return;
        }
        
        $contactId = (int)$requestData['contact_id'];
        
        if (!$contactId) {
            http_response_code(400);
            echo json_encode(['error' => 'ID контакта не указан или некорректен.']);
            return;
        }
        
        // Удаляем контакт
        $success = $this->contactModel->removeContact($userId, $contactId);
        
        // Добавляем заголовки CORS
        header('Content-Type: application/json');
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        
        if ($success) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Не удалось удалить контакт.']);
        }
    }
    
    /**
     * Обновление никнейма контакта
     */
    public function updateContact(array $userData): void {
        // Проверяем метод запроса
        if ($_SERVER['REQUEST_METHOD'] !== 'PATCH') {
            http_response_code(405);
            echo json_encode(['error' => 'Метод не поддерживается. Используйте PATCH-запрос.']);
            return;
        }
        
        $userId = $userData['user_id'];
        
        // Получаем данные из запроса
        $requestData = json_decode(file_get_contents('php://input'), true);
        
        // Проверяем корректность данных
        if (!$requestData || !isset($requestData['data']) || 
            !isset($requestData['data']['contact_id']) || 
            !isset($requestData['data']['nickname'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Неверные данные запроса. Требуются contact_id и nickname.']);
            return;
        }
        
        $contactId = (int)$requestData['data']['contact_id'];
        $nickname = $requestData['data']['nickname'];
        
        // Проверяем, что контакт существует
        $contact = $this->contactModel->getContact($userId, $contactId);
        if (!$contact) {
            http_response_code(404);
            echo json_encode(['error' => 'Контакт не найден.']);
            return;
        }
        
        // Обновляем никнейм контакта
        $success = $this->contactModel->updateContactNickname($userId, $contactId, $nickname);
        
        // Добавляем заголовки CORS
        header('Content-Type: application/json');
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        
        if ($success) {
            echo json_encode([
                'success' => true,
                'contact' => [
                    'id' => $contactId,
                    'nickname' => $nickname
                ]
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Не удалось обновить никнейм контакта.']);
        }
    }
}
