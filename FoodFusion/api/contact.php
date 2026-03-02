<?php
require_once __DIR__ . '/../includes/config.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            
            // Validate required fields
            $required = ['first_name', 'last_name', 'email', 'subject', 'message'];
            foreach ($required as $field) {
                if (empty($input[$field])) {
                    sendErrorResponse("$field is required");
                }
            }
            
            // Validate email
            if (!validateEmail($input['email'])) {
                sendErrorResponse("Invalid email format");
            }
            
            // Insert contact message
            $pdo = getPDO();
            $stmt = $pdo->prepare("
                INSERT INTO contact_messages (first_name, last_name, email, phone, subject, message, newsletter_subscribed, privacy_accepted)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                sanitizeInput($input['first_name']),
                sanitizeInput($input['last_name']),
                sanitizeInput($input['email']),
                sanitizeInput($input['phone'] ?? ''),
                sanitizeInput($input['subject']),
                sanitizeInput($input['message']),
                $input['newsletter'] ?? false,
                $input['privacy'] ?? true
            ]);
            
            sendSuccessResponse(['message_id' => $pdo->lastInsertId()], 'Message sent successfully');
            break;
            
        default:
            sendErrorResponse("Method not allowed", 405);
    }
    
} catch (Exception $e) {
    logError("Contact API error", ['error' => $e->getMessage()]);
    sendErrorResponse($e->getMessage());
}
?>