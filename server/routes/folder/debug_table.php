<?php
// Включаем отображение всех ошибок для отладки
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once '../../models/Database.php';
require_once '../../utils/auth.php';

// Проверка авторизации
$user = authenticate();

if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Необходима авторизация']);
    exit;
}

try {
    // Создаем экземпляр подключения к БД
    $db = new Database();
    $conn = $db->getConnection();
    
    // Получаем структуру таблицы user_folders
    $sql = "DESCRIBE user_folders";
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    
    $structure = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Возвращаем результат
    header('Content-Type: application/json');
    echo json_encode([
        'table_structure' => $structure
    ]);
} catch (Exception $e) {
    error_log('Ошибка при получении структуры таблицы: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Ошибка: ' . $e->getMessage()]);
    exit;
}
