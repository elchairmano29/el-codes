<?php
/**
 * FoodFusion PHP Development Server
 * Handles both static files and API routes
 */

$uri = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];

// Remove query string from URI
$uri = strtok($uri, '?');

// API routes
if (strpos($uri, '/api/') === 0) {
    // Handle API requests
    $apiFile = __DIR__ . $uri . '.php';
    
    if (file_exists($apiFile)) {
        include $apiFile;
        exit;
    } else {
        http_response_code(404);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'API endpoint not found']);
        exit;
    }
}

// Serve static files
$file = __DIR__ . $uri;

// Default to index.html for root
if ($uri === '/') {
    $file = __DIR__ . '/index.html';
}

// Check if file exists
if (file_exists($file) && is_file($file)) {
    // Set appropriate content type
    $extension = pathinfo($file, PATHINFO_EXTENSION);
    $contentTypes = [
        'html' => 'text/html',
        'css' => 'text/css',
        'js' => 'application/javascript',
        'json' => 'application/json',
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'gif' => 'image/gif',
        'svg' => 'image/svg+xml',
        'ico' => 'image/x-icon',
        'woff' => 'font/woff',
        'woff2' => 'font/woff2',
        'ttf' => 'font/ttf',
        'eot' => 'application/vnd.ms-fontobject'
    ];
    
    $contentType = $contentTypes[$extension] ?? 'text/plain';
    header('Content-Type: ' . $contentType);
    
    // Cache headers for static assets
    if (in_array($extension, ['css', 'js', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'woff', 'woff2', 'ttf', 'eot'])) {
        header('Cache-Control: public, max-age=3600');
    }
    
    readfile($file);
    exit;
}

// File not found
http_response_code(404);
echo "404 - File not found";
?>