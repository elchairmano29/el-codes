<?php
/**
 * FoodFusion Configuration File
 * Global settings and constants
 */

// Error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Security settings
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

// CORS headers for API
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    exit(0);
}

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Application settings
define('APP_NAME', 'FoodFusion');
define('APP_VERSION', '1.0.0');
define('BASE_URL', 'http://localhost:5000');

// Security settings
define('PASSWORD_MIN_LENGTH', 8);
define('MAX_LOGIN_ATTEMPTS', 3);
define('LOCKOUT_DURATION', 180); // 3 minutes in seconds

// File upload settings
define('MAX_FILE_SIZE', 5 * 1024 * 1024); // 5MB
define('ALLOWED_IMAGE_TYPES', ['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
define('UPLOAD_PATH', 'uploads/');

// Pagination settings
define('RECIPES_PER_PAGE', 12);
define('REVIEWS_PER_PAGE', 10);

// Session settings
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 0); // Set to 1 for HTTPS
ini_set('session.use_strict_mode', 1);
session_start();

// Include database configuration
require_once __DIR__ . '/../config/database.php';

// Utility functions
function sanitizeInput($input) {
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}

function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

function generateToken($length = 32) {
    return bin2hex(random_bytes($length));
}

function hashPassword($password) {
    return password_hash($password, PASSWORD_DEFAULT);
}

function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}

function sendJsonResponse($data, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function sendErrorResponse($message, $status = 400) {
    sendJsonResponse(['error' => $message, 'success' => false], $status);
}

function sendSuccessResponse($data = [], $message = 'Success') {
    sendJsonResponse(['success' => true, 'message' => $message, 'data' => $data]);
}

function logError($message, $context = []) {
    error_log(date('Y-m-d H:i:s') . " - " . $message . " - " . json_encode($context));
}

function isLoggedIn() {
    return isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
}

function requireLogin() {
    if (!isLoggedIn()) {
        sendErrorResponse('Authentication required', 401);
    }
}

function getCurrentUserId() {
    return $_SESSION['user_id'] ?? null;
}

function getCurrentUser() {
    if (!isLoggedIn()) {
        return null;
    }
    
    try {
        $pdo = getPDO();
        $stmt = $pdo->prepare("SELECT id, first_name, last_name, email, cooking_level FROM users WHERE id = ?");
        $stmt->execute([getCurrentUserId()]);
        return $stmt->fetch();
    } catch (Exception $e) {
        logError("Error fetching current user", ['error' => $e->getMessage()]);
        return null;
    }
}

function validatePassword($password) {
    return strlen($password) >= PASSWORD_MIN_LENGTH &&
           preg_match('/[A-Z]/', $password) &&
           preg_match('/[a-z]/', $password) &&
           preg_match('/\d/', $password);
}

function getClientIP() {
    $ipKeys = ['HTTP_CLIENT_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR'];
    foreach ($ipKeys as $key) {
        if (array_key_exists($key, $_SERVER) === true) {
            foreach (explode(',', $_SERVER[$key]) as $ip) {
                $ip = trim($ip);
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false) {
                    return $ip;
                }
            }
        }
    }
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}
?>