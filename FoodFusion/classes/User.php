<?php
require_once __DIR__ . '/../includes/config.php';

class User {
    private $pdo;

    public function __construct() {
        $this->pdo = getPDO();
    }

    public function register($userData) {
        try {
            // Check if email already exists
            $stmt = $this->pdo->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->execute([$userData['email']]);
            if ($stmt->fetch()) {
                throw new Exception("Email already exists");
            }

            // Hash password
            $hashedPassword = hashPassword($userData['password']);

            // Insert new user
            $stmt = $this->pdo->prepare("
                INSERT INTO users (first_name, last_name, email, password_hash, cooking_level, interests, newsletter_subscribed)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");

            $interests = isset($userData['interests']) ? '{' . implode(',', $userData['interests']) . '}' : '{}';

            $stmt->execute([
                $userData['first_name'],
                $userData['last_name'],
                $userData['email'],
                $hashedPassword,
                $userData['cooking_level'] ?? 'beginner',
                $interests,
                $userData['newsletter'] ?? false
            ]);

            return $this->pdo->lastInsertId();
        } catch (Exception $e) {
            logError("User registration failed", ['error' => $e->getMessage(), 'email' => $userData['email']]);
            throw $e;
        }
    }

    public function login($email, $password) {
        try {
            // Check for account lockout
            if ($this->isAccountLocked($email)) {
                throw new Exception("Account temporarily locked due to multiple failed attempts");
            }

            // Get user
            $stmt = $this->pdo->prepare("SELECT id, first_name, last_name, email, password_hash, is_active FROM users WHERE email = ?");
            $stmt->execute([$email]);
            $user = $stmt->fetch();

            if (!$user || !$user['is_active']) {
                $this->recordLoginAttempt($email, false);
                throw new Exception("Invalid credentials");
            }

            // Verify password
            if (!verifyPassword($password, $user['password_hash'])) {
                $this->recordLoginAttempt($email, false);
                throw new Exception("Invalid credentials");
            }

            // Successful login
            $this->recordLoginAttempt($email, true);
            $this->clearFailedAttempts($email);

            // Start session
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_email'] = $user['email'];
            $_SESSION['user_name'] = $user['first_name'] . ' ' . $user['last_name'];

            return [
                'id' => $user['id'],
                'first_name' => $user['first_name'],
                'last_name' => $user['last_name'],
                'email' => $user['email']
            ];
        } catch (Exception $e) {
            logError("User login failed", ['error' => $e->getMessage(), 'email' => $email]);
            throw $e;
        }
    }

    public function logout() {
        session_destroy();
        return true;
    }

    public function recordLoginAttempt($email, $success) {
        try {
            $stmt = $this->pdo->prepare("
                INSERT INTO login_attempts (email, ip_address, success, user_agent)
                VALUES (?, ?, ?, ?)
            ");
            $stmt->execute([
                $email,
                getClientIP(),
                $success,
                $_SERVER['HTTP_USER_AGENT'] ?? ''
            ]);
        } catch (Exception $e) {
            logError("Failed to record login attempt", ['error' => $e->getMessage()]);
        }
    }

    public function isAccountLocked($email) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT COUNT(*) as failed_attempts 
                FROM login_attempts 
                WHERE email = ? 
                AND success = false 
                AND attempt_time > NOW() - INTERVAL '" . LOCKOUT_DURATION . " seconds'
            ");
            $stmt->execute([$email]);
            $result = $stmt->fetch();

            return $result['failed_attempts'] >= MAX_LOGIN_ATTEMPTS;
        } catch (Exception $e) {
            logError("Error checking account lockout", ['error' => $e->getMessage()]);
            return false;
        }
    }

    public function clearFailedAttempts($email) {
        try {
            $stmt = $this->pdo->prepare("DELETE FROM login_attempts WHERE email = ? AND success = false");
            $stmt->execute([$email]);
        } catch (Exception $e) {
            logError("Error clearing failed attempts", ['error' => $e->getMessage()]);
        }
    }

    public function getFailedAttempts($email) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT COUNT(*) as failed_attempts 
                FROM login_attempts 
                WHERE email = ? 
                AND success = false 
                AND attempt_time > NOW() - INTERVAL '" . LOCKOUT_DURATION . " seconds'
            ");
            $stmt->execute([$email]);
            $result = $stmt->fetch();

            return $result['failed_attempts'];
        } catch (Exception $e) {
            logError("Error getting failed attempts", ['error' => $e->getMessage()]);
            return 0;
        }
    }

    public function getUserById($id) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT id, first_name, last_name, email, cooking_level, interests, 
                       profile_avatar, profile_bio, created_at
                FROM users 
                WHERE id = ? AND is_active = true
            ");
            $stmt->execute([$id]);
            return $stmt->fetch();
        } catch (Exception $e) {
            logError("Error fetching user", ['error' => $e->getMessage(), 'user_id' => $id]);
            return null;
        }
    }

    public function updateProfile($userId, $data) {
        try {
            $stmt = $this->pdo->prepare("
                UPDATE users 
                SET first_name = ?, last_name = ?, cooking_level = ?, profile_bio = ?, updated_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([
                $data['first_name'],
                $data['last_name'],
                $data['cooking_level'],
                $data['profile_bio'] ?? '',
                $userId
            ]);

            return $stmt->rowCount() > 0;
        } catch (Exception $e) {
            logError("Error updating user profile", ['error' => $e->getMessage(), 'user_id' => $userId]);
            throw $e;
        }
    }

    public function changePassword($userId, $currentPassword, $newPassword) {
        try {
            // Get current password hash
            $stmt = $this->pdo->prepare("SELECT password_hash FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $user = $stmt->fetch();

            if (!$user || !verifyPassword($currentPassword, $user['password_hash'])) {
                throw new Exception("Current password is incorrect");
            }

            // Update password
            $newHashedPassword = hashPassword($newPassword);
            $stmt = $this->pdo->prepare("UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?");
            $stmt->execute([$newHashedPassword, $userId]);

            return $stmt->rowCount() > 0;
        } catch (Exception $e) {
            logError("Error changing password", ['error' => $e->getMessage(), 'user_id' => $userId]);
            throw $e;
        }
    }

    public function verifyEmail($userId) {
        try {
            $stmt = $this->pdo->prepare("UPDATE users SET email_verified = true, updated_at = NOW() WHERE id = ?");
            $stmt->execute([$userId]);
            return $stmt->rowCount() > 0;
        } catch (Exception $e) {
            logError("Error verifying email", ['error' => $e->getMessage(), 'user_id' => $userId]);
            throw $e;
        }
    }
}
?>