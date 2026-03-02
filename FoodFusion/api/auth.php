<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../classes/User.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

$user = new User();

try {
    switch ($method) {
        case 'POST':
            switch ($action) {
                case 'register':
                    $input = json_decode(file_get_contents('php://input'), true);
                    
                    // Validate required fields
                    $required = ['first_name', 'last_name', 'email', 'password', 'confirm_password'];
                    foreach ($required as $field) {
                        if (empty($input[$field])) {
                            sendErrorResponse("$field is required");
                        }
                    }
                    
                    // Validate email
                    if (!validateEmail($input['email'])) {
                        sendErrorResponse("Invalid email format");
                    }
                    
                    // Validate password
                    if (!validatePassword($input['password'])) {
                        sendErrorResponse("Password must be at least 8 characters with uppercase, lowercase, and number");
                    }
                    
                    // Check password confirmation
                    if ($input['password'] !== $input['confirm_password']) {
                        sendErrorResponse("Passwords do not match");
                    }
                    
                    // Register user
                    $userData = [
                        'first_name' => sanitizeInput($input['first_name']),
                        'last_name' => sanitizeInput($input['last_name']),
                        'email' => sanitizeInput($input['email']),
                        'password' => $input['password'],
                        'cooking_level' => sanitizeInput($input['cooking_level'] ?? 'beginner'),
                        'interests' => $input['interests'] ?? [],
                        'newsletter' => $input['newsletter'] ?? false
                    ];
                    
                    $userId = $user->register($userData);
                    sendSuccessResponse(['user_id' => $userId], 'Registration successful');
                    break;
                    
                case 'login':
                    $input = json_decode(file_get_contents('php://input'), true);
                    
                    if (empty($input['email']) || empty($input['password'])) {
                        sendErrorResponse("Email and password are required");
                    }
                    
                    $userData = $user->login($input['email'], $input['password']);
                    sendSuccessResponse($userData, 'Login successful');
                    break;
                    
                case 'logout':
                    $user->logout();
                    sendSuccessResponse([], 'Logout successful');
                    break;
                    
                case 'check-lockout':
                    $input = json_decode(file_get_contents('php://input'), true);
                    
                    if (empty($input['email'])) {
                        sendErrorResponse("Email is required");
                    }
                    
                    $isLocked = $user->isAccountLocked($input['email']);
                    $failedAttempts = $user->getFailedAttempts($input['email']);
                    
                    sendSuccessResponse([
                        'is_locked' => $isLocked,
                        'failed_attempts' => $failedAttempts,
                        'max_attempts' => MAX_LOGIN_ATTEMPTS,
                        'lockout_duration' => LOCKOUT_DURATION
                    ]);
                    break;
                    
                default:
                    sendErrorResponse("Invalid action", 404);
            }
            break;
            
        case 'GET':
            switch ($action) {
                case 'profile':
                    requireLogin();
                    $userData = $user->getUserById(getCurrentUserId());
                    if (!$userData) {
                        sendErrorResponse("User not found", 404);
                    }
                    sendSuccessResponse($userData);
                    break;
                    
                case 'session':
                    if (isLoggedIn()) {
                        $userData = getCurrentUser();
                        sendSuccessResponse($userData, 'User is logged in');
                    } else {
                        sendErrorResponse("Not logged in", 401);
                    }
                    break;
                    
                default:
                    sendErrorResponse("Invalid action", 404);
            }
            break;
            
        case 'PUT':
            switch ($action) {
                case 'profile':
                    requireLogin();
                    $input = json_decode(file_get_contents('php://input'), true);
                    
                    $success = $user->updateProfile(getCurrentUserId(), $input);
                    if ($success) {
                        sendSuccessResponse([], 'Profile updated successfully');
                    } else {
                        sendErrorResponse("Failed to update profile");
                    }
                    break;
                    
                case 'password':
                    requireLogin();
                    $input = json_decode(file_get_contents('php://input'), true);
                    
                    if (empty($input['current_password']) || empty($input['new_password'])) {
                        sendErrorResponse("Current and new password are required");
                    }
                    
                    if (!validatePassword($input['new_password'])) {
                        sendErrorResponse("New password must be at least 8 characters with uppercase, lowercase, and number");
                    }
                    
                    $success = $user->changePassword(getCurrentUserId(), $input['current_password'], $input['new_password']);
                    if ($success) {
                        sendSuccessResponse([], 'Password changed successfully');
                    } else {
                        sendErrorResponse("Failed to change password");
                    }
                    break;
                    
                default:
                    sendErrorResponse("Invalid action", 404);
            }
            break;
            
        default:
            sendErrorResponse("Method not allowed", 405);
    }
    
} catch (Exception $e) {
    logError("Auth API error", ['error' => $e->getMessage(), 'action' => $action]);
    sendErrorResponse($e->getMessage());
}
?>