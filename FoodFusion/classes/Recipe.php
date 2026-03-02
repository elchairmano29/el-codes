<?php
require_once __DIR__ . '/../includes/config.php';

class Recipe {
    private $pdo;

    public function __construct() {
        $this->pdo = getPDO();
    }

    public function create($recipeData) {
        try {
            $stmt = $this->pdo->prepare("
                INSERT INTO recipes (user_id, title, description, ingredients, instructions, 
                                   prep_time, cook_time, servings, difficulty_level, cuisine_type, 
                                   dietary_tags, image_url)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");

            $dietary_tags = isset($recipeData['dietary_tags']) ? 
                '{' . implode(',', $recipeData['dietary_tags']) . '}' : '{}';

            $stmt->execute([
                $recipeData['user_id'],
                $recipeData['title'],
                $recipeData['description'] ?? '',
                $recipeData['ingredients'],
                $recipeData['instructions'],
                $recipeData['prep_time'] ?? 0,
                $recipeData['cook_time'] ?? 0,
                $recipeData['servings'] ?? 1,
                $recipeData['difficulty_level'] ?? 'medium',
                $recipeData['cuisine_type'] ?? '',
                $dietary_tags,
                $recipeData['image_url'] ?? ''
            ]);

            return $this->pdo->lastInsertId();
        } catch (Exception $e) {
            logError("Recipe creation failed", ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    public function getAll($limit = RECIPES_PER_PAGE, $offset = 0, $filters = []) {
        try {
            $where = "WHERE r.is_approved = true";
            $params = [];

            if (!empty($filters['cuisine_type'])) {
                $where .= " AND r.cuisine_type = ?";
                $params[] = $filters['cuisine_type'];
            }

            if (!empty($filters['difficulty_level'])) {
                $where .= " AND r.difficulty_level = ?";
                $params[] = $filters['difficulty_level'];
            }

            if (!empty($filters['dietary_tags'])) {
                $where .= " AND ? = ANY(r.dietary_tags)";
                $params[] = $filters['dietary_tags'];
            }

            if (!empty($filters['search'])) {
                $where .= " AND (r.title ILIKE ? OR r.description ILIKE ?)";
                $searchTerm = '%' . $filters['search'] . '%';
                $params[] = $searchTerm;
                $params[] = $searchTerm;
            }

            $orderBy = "ORDER BY r.created_at DESC";
            if (!empty($filters['sort'])) {
                switch ($filters['sort']) {
                    case 'rating':
                        $orderBy = "ORDER BY r.rating DESC, r.review_count DESC";
                        break;
                    case 'prep_time':
                        $orderBy = "ORDER BY r.prep_time ASC";
                        break;
                    case 'title':
                        $orderBy = "ORDER BY r.title ASC";
                        break;
                }
            }

            $sql = "
                SELECT r.*, u.first_name, u.last_name,
                       COALESCE(r.rating, 0) as avg_rating,
                       COALESCE(r.review_count, 0) as total_reviews
                FROM recipes r
                JOIN users u ON r.user_id = u.id
                $where
                $orderBy
                LIMIT ? OFFSET ?
            ";

            $params[] = $limit;
            $params[] = $offset;

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll();
        } catch (Exception $e) {
            logError("Error fetching recipes", ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    public function getById($id) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT r.*, u.first_name, u.last_name, u.profile_avatar,
                       COALESCE(r.rating, 0) as avg_rating,
                       COALESCE(r.review_count, 0) as total_reviews
                FROM recipes r
                JOIN users u ON r.user_id = u.id
                WHERE r.id = ? AND r.is_approved = true
            ");
            $stmt->execute([$id]);
            return $stmt->fetch();
        } catch (Exception $e) {
            logError("Error fetching recipe", ['error' => $e->getMessage(), 'recipe_id' => $id]);
            throw $e;
        }
    }

    public function getByUserId($userId, $limit = RECIPES_PER_PAGE, $offset = 0) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT r.*, COALESCE(r.rating, 0) as avg_rating,
                       COALESCE(r.review_count, 0) as total_reviews
                FROM recipes r
                WHERE r.user_id = ?
                ORDER BY r.created_at DESC
                LIMIT ? OFFSET ?
            ");
            $stmt->execute([$userId, $limit, $offset]);
            return $stmt->fetchAll();
        } catch (Exception $e) {
            logError("Error fetching user recipes", ['error' => $e->getMessage(), 'user_id' => $userId]);
            throw $e;
        }
    }

    public function update($id, $recipeData, $userId) {
        try {
            // Verify ownership
            $stmt = $this->pdo->prepare("SELECT user_id FROM recipes WHERE id = ?");
            $stmt->execute([$id]);
            $recipe = $stmt->fetch();

            if (!$recipe || $recipe['user_id'] != $userId) {
                throw new Exception("Recipe not found or access denied");
            }

            $dietary_tags = isset($recipeData['dietary_tags']) ? 
                '{' . implode(',', $recipeData['dietary_tags']) . '}' : '{}';

            $stmt = $this->pdo->prepare("
                UPDATE recipes 
                SET title = ?, description = ?, ingredients = ?, instructions = ?,
                    prep_time = ?, cook_time = ?, servings = ?, difficulty_level = ?,
                    cuisine_type = ?, dietary_tags = ?, image_url = ?, updated_at = NOW()
                WHERE id = ? AND user_id = ?
            ");

            $stmt->execute([
                $recipeData['title'],
                $recipeData['description'] ?? '',
                $recipeData['ingredients'],
                $recipeData['instructions'],
                $recipeData['prep_time'] ?? 0,
                $recipeData['cook_time'] ?? 0,
                $recipeData['servings'] ?? 1,
                $recipeData['difficulty_level'] ?? 'medium',
                $recipeData['cuisine_type'] ?? '',
                $dietary_tags,
                $recipeData['image_url'] ?? '',
                $id,
                $userId
            ]);

            return $stmt->rowCount() > 0;
        } catch (Exception $e) {
            logError("Recipe update failed", ['error' => $e->getMessage(), 'recipe_id' => $id]);
            throw $e;
        }
    }

    public function delete($id, $userId) {
        try {
            $stmt = $this->pdo->prepare("DELETE FROM recipes WHERE id = ? AND user_id = ?");
            $stmt->execute([$id, $userId]);
            return $stmt->rowCount() > 0;
        } catch (Exception $e) {
            logError("Recipe deletion failed", ['error' => $e->getMessage(), 'recipe_id' => $id]);
            throw $e;
        }
    }

    public function getFeatured($limit = 6) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT r.*, u.first_name, u.last_name,
                       COALESCE(r.rating, 0) as avg_rating,
                       COALESCE(r.review_count, 0) as total_reviews
                FROM recipes r
                JOIN users u ON r.user_id = u.id
                WHERE r.is_featured = true AND r.is_approved = true
                ORDER BY r.rating DESC, r.review_count DESC
                LIMIT ?
            ");
            $stmt->execute([$limit]);
            return $stmt->fetchAll();
        } catch (Exception $e) {
            logError("Error fetching featured recipes", ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    public function search($query, $limit = RECIPES_PER_PAGE, $offset = 0) {
        try {
            $searchTerm = '%' . $query . '%';
            $stmt = $this->pdo->prepare("
                SELECT r.*, u.first_name, u.last_name,
                       COALESCE(r.rating, 0) as avg_rating,
                       COALESCE(r.review_count, 0) as total_reviews
                FROM recipes r
                JOIN users u ON r.user_id = u.id
                WHERE r.is_approved = true 
                AND (r.title ILIKE ? OR r.description ILIKE ? OR r.ingredients ILIKE ?)
                ORDER BY r.rating DESC, r.review_count DESC
                LIMIT ? OFFSET ?
            ");
            $stmt->execute([$searchTerm, $searchTerm, $searchTerm, $limit, $offset]);
            return $stmt->fetchAll();
        } catch (Exception $e) {
            logError("Recipe search failed", ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    public function updateRating($recipeId) {
        try {
            $stmt = $this->pdo->prepare("
                UPDATE recipes 
                SET rating = (
                    SELECT AVG(rating)::numeric(3,2) 
                    FROM recipe_reviews 
                    WHERE recipe_id = ?
                ),
                review_count = (
                    SELECT COUNT(*) 
                    FROM recipe_reviews 
                    WHERE recipe_id = ?
                )
                WHERE id = ?
            ");
            $stmt->execute([$recipeId, $recipeId, $recipeId]);
            return true;
        } catch (Exception $e) {
            logError("Error updating recipe rating", ['error' => $e->getMessage()]);
            return false;
        }
    }

    public function approve($recipeId) {
        try {
            $stmt = $this->pdo->prepare("UPDATE recipes SET is_approved = true WHERE id = ?");
            $stmt->execute([$recipeId]);
            return $stmt->rowCount() > 0;
        } catch (Exception $e) {
            logError("Recipe approval failed", ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    public function getCount($filters = []) {
        try {
            $where = "WHERE r.is_approved = true";
            $params = [];

            if (!empty($filters['cuisine_type'])) {
                $where .= " AND r.cuisine_type = ?";
                $params[] = $filters['cuisine_type'];
            }

            if (!empty($filters['difficulty_level'])) {
                $where .= " AND r.difficulty_level = ?";
                $params[] = $filters['difficulty_level'];
            }

            if (!empty($filters['search'])) {
                $where .= " AND (r.title ILIKE ? OR r.description ILIKE ?)";
                $searchTerm = '%' . $filters['search'] . '%';
                $params[] = $searchTerm;
                $params[] = $searchTerm;
            }

            $stmt = $this->pdo->prepare("SELECT COUNT(*) as total FROM recipes r $where");
            $stmt->execute($params);
            $result = $stmt->fetch();
            return $result['total'];
        } catch (Exception $e) {
            logError("Error counting recipes", ['error' => $e->getMessage()]);
            return 0;
        }
    }
}
?>