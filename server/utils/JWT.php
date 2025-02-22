<?php

class JWT {
    private static string $secret = 'your-secret-key'; // В продакшене использовать безопасный ключ из конфига
    
    public static function generate(array $payload): string {
        $header = json_encode([
            'typ' => 'JWT',
            'alg' => 'HS256'
        ]);
        
        $payload['iat'] = time(); // время создания
        $payload['exp'] = time() + (60 * 60 * 24 * 7); // срок действия 7 дней
        
        $base64Header = self::base64UrlEncode($header);
        $base64Payload = self::base64UrlEncode(json_encode($payload));
        
        $signature = hash_hmac('sha256', 
            $base64Header . "." . $base64Payload, 
            self::$secret, 
            true
        );
        
        $base64Signature = self::base64UrlEncode($signature);
        
        return $base64Header . "." . $base64Payload . "." . $base64Signature;
    }
    
    public static function verify(string $token): ?array {
        $parts = explode('.', $token);
        
        if (count($parts) !== 3) {
            return null;
        }
        
        [$base64Header, $base64Payload, $signature] = $parts;
        
        $signature = self::base64UrlDecode($signature);
        
        $expectedSignature = hash_hmac('sha256',
            $base64Header . "." . $base64Payload,
            self::$secret,
            true
        );
        
        if (!hash_equals($expectedSignature, $signature)) {
            return null;
        }
        
        $payload = json_decode(self::base64UrlDecode($base64Payload), true);
        
        if ($payload === null) {
            return null;
        }
        
        // Проверка срока действия
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return null;
        }
        
        return $payload;
    }
    
    private static function base64UrlEncode(string $data): string {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
    
    private static function base64UrlDecode(string $data): string {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}
