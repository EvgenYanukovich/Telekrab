<?php

require_once __DIR__ . '/../../controllers/AuthController.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';

AuthMiddleware::handleCORS();

$controller = new AuthController();
$controller->login();
