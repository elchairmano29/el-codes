<?php
require_once __DIR__ . '/../includes/config.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$recipeId = $_GET['recipe_id'] ?? null;

try {
    requireLogin();
    $userId = getCurrentUserId();
    
    switch ($method) {
        case 'GET':
            // Get user's favorite recipes
            $pdo = getPDO();
            $stmt = $pdo->prepare("
                SELECT r.*, u.first_name, u.last_name,
                       COALESCE(r.rating, 0) as avg_rating,
                       COALESCE(r.review_count, 0) as total_reviews
                FROM user_favorites uf
                JOIN recipes r ON uf.recipe_id = r.id
                JOIN users u ON r.user_id = u.id
                WHERE uf.user_id = ?
                ORDER BY uf.created_at DESC
            ");
            $stmt->execute([$userId]);
            $favorites = $stmt->fetchAll();
            
            sendSuccessResponse(['favorites' => $favorites]);
            break;
            
        case 'POST':
            if (!$recipeId) {
                sendErrorResponse("Recipe ID is required");
            }
            
            $pdo = getPDO();
            
            // Check if already favorited
            $stmt = $pdo->prepare("SELECT id FROM user_favorites WHERE user_id = ? AND recipe_id = ?");
            $stmt->execute([$userId, $recipeId]);
            
            if ($stmt->fetch()) {
                sendErrorResponse("Recipe already in favorites");
            }
            
            // Add to favorites
            $stmt = $pdo->prepare("INSERT INTO user_favorites (user_id, recipe_id) VALUES (?, ?)");
            $stmt->execute([$userId, $recipeId]);
            
            sendSuccessResponse(['favorite_id' => $pdo->lastInsertId()], 'Recipe added to favorites');
            break;
            
        case 'DELETE':
            if (!$recipeId) {
                sendErrorResponse("Recipe ID is required");
            }
            
            $pdo = getPDO();
            $stmt = $pdo->prepare("DELETE FROM user_favorites WHERE user_id = ? AND recipe_id = ?");
            $stmt->execute([$userId, $recipeId]);
            
            if ($stmt->rowCount() > 0) {
                sendSuccessResponse([], 'Recipe removed from favorites');
            } else {
                sendErrorResponse("Recipe not found in favorites");
            }
            break;
            
        default:
            sendErrorResponse("Method not allowed", 405);
    }
    
} catch (Exception $e) {
    logError("Favorites API error", ['error' => $e->getMessage()]);
    sendErrorResponse($e->getMessage());
}
?>