<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../classes/Recipe.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$id = $_GET['id'] ?? null;

$recipe = new Recipe();

try {
    switch ($method) {
        case 'GET':
            switch ($action) {
                case 'list':
                    $page = intval($_GET['page'] ?? 1);
                    $limit = intval($_GET['limit'] ?? RECIPES_PER_PAGE);
                    $offset = ($page - 1) * $limit;
                    
                    $filters = [
                        'cuisine_type' => $_GET['cuisine_type'] ?? '',
                        'difficulty_level' => $_GET['difficulty_level'] ?? '',
                        'dietary_tags' => $_GET['dietary_tags'] ?? '',
                        'search' => $_GET['search'] ?? '',
                        'sort' => $_GET['sort'] ?? 'created_at'
                    ];
                    
                    $recipes = $recipe->getAll($limit, $offset, $filters);
                    $total = $recipe->getCount($filters);
                    
                    sendSuccessResponse([
                        'recipes' => $recipes,
                        'pagination' => [
                            'current_page' => $page,
                            'total_pages' => ceil($total / $limit),
                            'total_count' => $total,
                            'per_page' => $limit
                        ]
                    ]);
                    break;
                    
                case 'featured':
                    $limit = intval($_GET['limit'] ?? 6);
                    $recipes = $recipe->getFeatured($limit);
                    sendSuccessResponse(['recipes' => $recipes]);
                    break;
                    
                case 'search':
                    $query = $_GET['q'] ?? '';
                    if (empty($query)) {
                        sendErrorResponse("Search query is required");
                    }
                    
                    $page = intval($_GET['page'] ?? 1);
                    $limit = intval($_GET['limit'] ?? RECIPES_PER_PAGE);
                    $offset = ($page - 1) * $limit;
                    
                    $recipes = $recipe->search($query, $limit, $offset);
                    sendSuccessResponse(['recipes' => $recipes]);
                    break;
                    
                case 'user':
                    requireLogin();
                    $userId = $_GET['user_id'] ?? getCurrentUserId();
                    $page = intval($_GET['page'] ?? 1);
                    $limit = intval($_GET['limit'] ?? RECIPES_PER_PAGE);
                    $offset = ($page - 1) * $limit;
                    
                    $recipes = $recipe->getByUserId($userId, $limit, $offset);
                    sendSuccessResponse(['recipes' => $recipes]);
                    break;
                    
                case 'detail':
                    if (!$id) {
                        sendErrorResponse("Recipe ID is required");
                    }
                    
                    $recipeData = $recipe->getById($id);
                    if (!$recipeData) {
                        sendErrorResponse("Recipe not found", 404);
                    }
                    
                    sendSuccessResponse(['recipe' => $recipeData]);
                    break;
                    
                default:
                    sendErrorResponse("Invalid action", 404);
            }
            break;
            
        case 'POST':
            requireLogin();
            $input = json_decode(file_get_contents('php://input'), true);
            
            // Validate required fields
            $required = ['title', 'ingredients', 'instructions'];
            foreach ($required as $field) {
                if (empty($input[$field])) {
                    sendErrorResponse("$field is required");
                }
            }
            
            $recipeData = [
                'user_id' => getCurrentUserId(),
                'title' => sanitizeInput($input['title']),
                'description' => sanitizeInput($input['description'] ?? ''),
                'ingredients' => sanitizeInput($input['ingredients']),
                'instructions' => sanitizeInput($input['instructions']),
                'prep_time' => intval($input['prep_time'] ?? 0),
                'cook_time' => intval($input['cook_time'] ?? 0),
                'servings' => intval($input['servings'] ?? 1),
                'difficulty_level' => sanitizeInput($input['difficulty_level'] ?? 'medium'),
                'cuisine_type' => sanitizeInput($input['cuisine_type'] ?? ''),
                'dietary_tags' => $input['dietary_tags'] ?? [],
                'image_url' => sanitizeInput($input['image_url'] ?? '')
            ];
            
            $recipeId = $recipe->create($recipeData);
            sendSuccessResponse(['recipe_id' => $recipeId], 'Recipe created successfully');
            break;
            
        case 'PUT':
            requireLogin();
            if (!$id) {
                sendErrorResponse("Recipe ID is required");
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            
            $recipeData = [
                'title' => sanitizeInput($input['title']),
                'description' => sanitizeInput($input['description'] ?? ''),
                'ingredients' => sanitizeInput($input['ingredients']),
                'instructions' => sanitizeInput($input['instructions']),
                'prep_time' => intval($input['prep_time'] ?? 0),
                'cook_time' => intval($input['cook_time'] ?? 0),
                'servings' => intval($input['servings'] ?? 1),
                'difficulty_level' => sanitizeInput($input['difficulty_level'] ?? 'medium'),
                'cuisine_type' => sanitizeInput($input['cuisine_type'] ?? ''),
                'dietary_tags' => $input['dietary_tags'] ?? [],
                'image_url' => sanitizeInput($input['image_url'] ?? '')
            ];
            
            $success = $recipe->update($id, $recipeData, getCurrentUserId());
            if ($success) {
                sendSuccessResponse([], 'Recipe updated successfully');
            } else {
                sendErrorResponse("Failed to update recipe or access denied");
            }
            break;
            
        case 'DELETE':
            requireLogin();
            if (!$id) {
                sendErrorResponse("Recipe ID is required");
            }
            
            $success = $recipe->delete($id, getCurrentUserId());
            if ($success) {
                sendSuccessResponse([], 'Recipe deleted successfully');
            } else {
                sendErrorResponse("Failed to delete recipe or access denied");
            }
            break;
            
        default:
            sendErrorResponse("Method not allowed", 405);
    }
    
} catch (Exception $e) {
    logError("Recipe API error", ['error' => $e->getMessage(), 'action' => $action, 'id' => $id]);
    sendErrorResponse($e->getMessage());
}
?>