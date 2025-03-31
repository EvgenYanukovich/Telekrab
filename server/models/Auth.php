<?php
/**
 * u041cu043eu0434u0435u043bu044c u0434u043bu044f u0430u0443u0442u0435u043du0442u0438u0444u0438u043au0430u0446u0438u0438 u043fu043eu043bu044cu0437u043eu0432u0430u0442u0435u043bu0435u0439
 */
class Auth {
    private PDO $db;
    
    public function __construct() {
        require_once __DIR__ . '/Database.php';
        $this->db = Database::getInstance();
    }
    
    /**
     * u041fu0440u043eu0432u0435u0440u044fu0435u0442 JWT-u0442u043eu043au0435u043d u0438 u0432u043eu0437u0432u0440u0430u0449u0430u0435u0442 u0438u043du0444u043eu0440u043cu0430u0446u0438u044u u043e u043fu043eu043bu044cu0437u043eu0432u0430u0442u0435u043bu0435
     * 
     * @return array|bool u0438u043du0444u043eu0440u043cu0430u0446u0438u044a u043e u043fu043eu043bu044cu0437u043eu0432u0430u0442u0435u043bu0435 u0438u043b0438 false u0435u0441u043b0438 u0442u043eu043au0435u043d u043du0435u04340435u0439u0441u04420432u0438u04420435u043bu0435u043d
     */
    public function authenticate(): array|bool {
        // u041fu043eu043bu0443u0447u0430u0435u043c u0442u043eu043au0435u043d u0438u0437 u0437u0430u0433u043eu043bu043eu0432u043au0430 Authorization
        $headers = getallheaders();
        $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
        
        if (empty($authHeader) || !str_starts_with($authHeader, 'Bearer ')) {
            return false;
        }
        
        $token = substr($authHeader, 7); // u0423u0434u0430u043bu044fu0435u043c 'Bearer ' u0438u0437 u0437u0430u0433u043eu043bu043eu0432u043au0430
        
        if (empty($token)) {
            return false;
        }
        
        // u041fu0440u043eu0432u0435u0440u044fu0435u043c JWT-u0442u043eu043au0435u043d
        require_once __DIR__ . '/../utils/JWT.php';
        $payload = JWT::verify($token);
        
        if (!$payload || !isset($payload['user_id'])) {
            return false;
        }
        
        // u041fu043eu043bu0443u0447u0430u0435u043c u0438u043du0444u043eu0440u043cu0430u0446u0438u044u u043e u043fu043eu043bu044cu0437u043eu0432u0430u0442u0435u043bu0435
        $sql = "SELECT * FROM users WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$payload['user_id']]);
        
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            return false;
        }
        
        // u0414u043eu0431u0430u0432u043bu044fu0435u043c u043au043bu044eu0447 user_id u0434u043bu044f u0441u043eu0432u043cu0435u0441u0442u0438u043cu043eu0441u0442u0438 u0441 u0434u0440u0443u0433u0438u043cu0438 u0447u0430u0441u0442u044fu043cu0438 u043fu0440u0438u043bu043eu0436u0435u043du0438u044f
        $user['user_id'] = $user['id'];
        
        return $user;
    }
    
    /**
     * u0413u0435u043du0435u0440u0438u0440u0443u0435u0442 u043du043eu0432u044bu0439 JWT-u0442u043eu043au0435u043d u0434u043bu044f u043fu043eu043bu044cu0437u043eu0432u0430u0442u0435u043bu044f
     * 
     * @param int $userId ID u043fu043eu043bu044cu0437u043eu0432u0430u0442u0435u043bu044f
     * @return string u0421u0433u0435u043du0435u0440u0438u0440u043eu0432u0430u043du043du044bu0439 u0442u043eu043au0435u043d
     */
    public function generateToken(int $userId): string {
        $token = bin2hex(random_bytes(32));
        
        // u0423u0434u0430u043bu044fu0435u043c u0441u0442u0430u0440u044bu0435 u0441u0435u0441u0441u0438u0438 u0434u043bu044f u044du0442u043eu0433u043e u043fu043eu043bu044cu0437u043eu0432u0430u0442u0435u043bu044f
        $deleteOldSql = "DELETE FROM user_sessions WHERE user_id = ?";
        $stmt = $this->db->prepare($deleteOldSql);
        $stmt->execute([$userId]);
        
        // u0421u043eu0445u0440u0430u043du044fu0435u043c u043du043eu0432u0443u044u u0441u0435u0441u0441u0438u044u
        $expiresAt = date('Y-m-d H:i:s', strtotime('+30 days'));
        $sql = "INSERT INTO user_sessions (user_id, token, expired_at) VALUES (?, ?, ?)";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$userId, $token, $expiresAt]);
        
        return $token;
    }
    
    /**
     * u0412u044bu0445u043eu0434 u0438u0437 u0441u0438u0441u0442u0435u043cu044b (u0443u0434u0430u043bu0435u043du0438u0435 u0442u043eu043au0435u043du0430)
     * 
     * @param string $token u0422u043eu043au0435u043d u0434u043bu044f u0443u0434u0430u043bu0435u043du0438u044f
     * @return bool u0423u0441u043fu0435u0445 u043eu043fu0435u0440u0430u0446u0438u0438
     */
    public function logout(string $token): bool {
        $sql = "DELETE FROM user_sessions WHERE token = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$token]);
        
        return $stmt->rowCount() > 0;
    }
}
