<?php
/**
 * u0424u0443u043du043au0446u0438u044f u043fu043eu0434u043au043bu044eu0447u0435u043du0438u044f u043a u0431u0430u0437u0435 u0434u0430u043du043du044bu0445
 */
function getDBConnection(): PDO {
    $host = 'MySQL-8.2';
    $db = 'telekrab';
    $user = 'root';
    $pass = '';
    $charset = 'utf8mb4';

    $dsn = "mysql:host=$host;dbname=$db;charset=$charset";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    
    try {
        $pdo = new PDO($dsn, $user, $pass, $options);
        return $pdo;
    } catch (\PDOException $e) {
        // u0412 u043fu0440u043eu0434u0430u043au0448u0435u043du0435 u043bu0443u0447u0448u0435 u043bu043eu0433u0438u0440u043eu0432u0430u0442u044c u043eu0448u0438u0431u043au0443, u0430 u043du0435 u0432u044bu0432u043eu0434u0438u0442u044c
        throw new \PDOException($e->getMessage(), (int)$e->getCode());
    }
}
