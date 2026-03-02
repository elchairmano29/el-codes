<?php
require_once __DIR__ . '/../includes/config.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (empty($input['email'])) {
                sendErrorResponse("Email is required");
            }
            
            if (!validateEmail($input['email'])) {
                sendErrorResponse("Invalid email format");
            }
            
            $pdo = getPDO();
            
            // Check if email already exists
            $stmt = $pdo->prepare("SELECT id FROM newsletter_subscribers WHERE email = ?");
            $stmt->execute([sanitizeInput($input['email'])]);
            
            if ($stmt->fetch()) {
                sendErrorResponse("Email already subscribed");
            }
            
            // Add new subscriber
            $stmt = $pdo->prepare("
                INSERT INTO newsletter_subscribers (email, unsubscribe_token)
                VALUES (?, ?)
            ");
            
            $unsubscribeToken = generateToken();
            $stmt->execute([
                sanitizeInput($input['email']),
                $unsubscribeToken
            ]);
            
            sendSuccessResponse(['subscriber_id' => $pdo->lastInsertId()], 'Successfully subscribed to newsletter');
            break;
            
        case 'DELETE':
            $email = $_GET['email'] ?? '';
            $token = $_GET['token'] ?? '';
            
            if (empty($email) || empty($token)) {
                sendErrorResponse("Email and token are required");
            }
            
            $pdo = getPDO();
            $stmt = $pdo->prepare("
                UPDATE newsletter_subscribers 
                SET is_active = false 
                WHERE email = ? AND unsubscribe_token = ?
            ");
            $stmt->execute([sanitizeInput($email), $token]);
            
            if ($stmt->rowCount() > 0) {
                sendSuccessResponse([], 'Successfully unsubscribed');
            } else {
                sendErrorResponse("Invalid unsubscribe link");
            }
            break;
            
        default:
            sendErrorResponse("Method not allowed", 405);
    }
    
} catch (Exception $e) {
    logError("Newsletter API error", ['error' => $e->getMessage()]);
    sendErrorResponse($e->getMessage());
}
?>