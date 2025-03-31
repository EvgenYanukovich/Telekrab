<?php
/**
 * API u0434u043bu044f u0441u043eu0437u0434u0430u043du0438u044f u043du043eu0432u043eu0433u043e u0447u0430u0442u0430
 * POST /chats/create
 * u0414u0430u043du043du044bu0435: contact_id - ID u043fu043eu043bu044cu0437u043eu0432u0430u0442u0435u043bu044f u0434u043bu044f u043bu0438u0447u043du043eu0433u043e u0447u0430u0442u0430
 */

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../../models/Chat.php';
require_once __DIR__ . '/../../models/Auth.php';

// u041fu0440u043eu0432u0435u0440u044fu0435u043c u043cu0435u0442u043eu0434 u0437u0430u043fu0440u043eu0441u0430
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'u041cu0435u0442u043eu0434 u043du0435 u0440u0430u0437u0440u0435u0448u0435u043d']);
    exit;
}

// u041fu0440u043eu0432u0435u0440u044fu0435u043c u0430u0432u0442u043eu0440u0438u0437u0430u0446u0438u044e
$auth = new Auth();
$user = $auth->authenticate();

if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'u041du0435u043eu0431u0445u043eu0434u0438u043cu0430 u0430u0432u0442u043eu0440u0438u0437u0430u0446u0438u044f']);
    exit;
}

// u041fu043eu043bu0443u0447u0430u0435u043c u0434u0430u043du043du044bu0435 u0437u0430u043fu0440u043eu0441u0430
$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['contact_id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'u041du0435u043eu0431u0445u043eu0434u0438u043cu043e u0443u043au0430u0437u0430u0442u044c contact_id']);
    exit;
}

$contactId = (int)$data['contact_id'];

// u0421u043eu0437u0434u0430u0435u043c u043du043eu0432u044bu0439 u0447u0430u0442
$chat = new Chat();
$chatId = $chat->createPrivateChat($user['id'], $contactId);

if ($chatId) {
    // u041fu043eu043bu0443u0447u0430u0435u043c u0434u0430u043du043du044bu0435 u0441u043eu0437u0434u0430u043du043du043eu0433u043e u0447u0430u0442u0430
    $allChats = $chat->getAllChats($user['id']);
    $createdChat = null;
    
    foreach ($allChats as $chatInfo) {
        if ($chatInfo['id'] == $chatId) {
            $createdChat = $chatInfo;
            break;
        }
    }
    
    echo json_encode(['success' => true, 'chat' => $createdChat]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'u041eu0448u0438u0431u043au0430 u043fu0440u0438 u0441u043eu0437u0434u0430u043du0438u0438 u0447u0430u0442u0430']);
}
