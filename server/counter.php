<?php
header("Access-Control-Allow-Origin: https://telekrab.org");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// File to store counter value
$counterFile = __DIR__ . '/counter.txt';

// Initialize counter file if it doesn't exist
if (!file_exists($counterFile)) {
    file_put_contents($counterFile, '0');
    chmod($counterFile, 0666);
}

try {
    $fp = fopen($counterFile, 'r+');
    if (!$fp) {
        throw new Exception('Could not open counter file');
    }

    // Get exclusive lock for both reading and writing
    flock($fp, LOCK_EX);
    
    $counter = (int)fgets($fp);
    
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $counter++;
        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, (string)$counter);
    }
    
    flock($fp, LOCK_UN);
    fclose($fp);
    
    echo json_encode(['counter' => $counter]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
