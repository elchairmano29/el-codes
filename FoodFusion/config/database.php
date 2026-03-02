<?php
/**
 * FoodFusion Database Configuration
 * PostgreSQL database connection and configuration
 */

class Database {
    private $host;
    private $port;
    private $dbname;
    private $username;
    private $password;
    private $connection;

    public function __construct() {
        // Parse DATABASE_URL environment variable
        $database_url = getenv('DATABASE_URL');
        if ($database_url) {
            $url = parse_url($database_url);
            $this->host = $url['host'];
            $this->port = $url['port'] ?? 5432;
            $this->dbname = ltrim($url['path'], '/');
            $this->username = $url['user'];
            $this->password = $url['pass'];
        } else {
            // Fallback to individual environment variables
            $this->host = getenv('PGHOST') ?: 'localhost';
            $this->port = getenv('PGPORT') ?: 5432;
            $this->dbname = getenv('PGDATABASE') ?: 'foodfusion';
            $this->username = getenv('PGUSER') ?: 'postgres';
            $this->password = getenv('PGPASSWORD') ?: '';
        }
    }

    public function connect() {
        try {
            $dsn = "pgsql:host={$this->host};port={$this->port};dbname={$this->dbname}";
            $this->connection = new PDO($dsn, $this->username, $this->password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ]);
            return $this->connection;
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            throw new Exception("Database connection failed");
        }
    }

    public function getConnection() {
        if (!$this->connection) {
            $this->connect();
        }
        return $this->connection;
    }

    public function closeConnection() {
        $this->connection = null;
    }

    public function testConnection() {
        try {
            $pdo = $this->getConnection();
            $stmt = $pdo->query("SELECT 1");
            return $stmt !== false;
        } catch (Exception $e) {
            return false;
        }
    }
}

// Database helper functions
function getDatabase() {
    static $database = null;
    if ($database === null) {
        $database = new Database();
    }
    return $database;
}

function getPDO() {
    return getDatabase()->getConnection();
}
?>