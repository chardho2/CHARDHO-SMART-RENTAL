<?php
/**
 * Car Rental System - Standalone Backend Server
 * Simple PHP server for development/testing without full installation
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'car_rental');

// Database connection
function getDB() {
    static $conn = null;
    if ($conn === null) {
        $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
        if ($conn->connect_error) {
            return null;
        }
    }
    return $conn;
}

// Response helper
function sendResponse($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit();
}

// Get request path
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// API Routes
switch ($path) {
    case '/api/status':
        $db = getDB();
        sendResponse([
            'status' => 'online',
            'database' => $db ? 'connected' : 'disconnected',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        break;

    case '/api/cars':
        if ($method === 'GET') {
            $db = getDB();
            if (!$db) sendResponse(['error' => 'Database connection failed'], 500);
            
            $result = $db->query("SELECT * FROM cars WHERE status = 'available' LIMIT 10");
            $cars = [];
            while ($row = $result->fetch_assoc()) {
                $cars[] = $row;
            }
            sendResponse(['cars' => $cars]);
        }
        break;

    case '/api/bookings':
        if ($method === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            $db = getDB();
            if (!$db) sendResponse(['error' => 'Database connection failed'], 500);
            
            $stmt = $db->prepare("INSERT INTO bookings (car_id, customer_name, start_date, end_date) VALUES (?, ?, ?, ?)");
            $stmt->bind_param("isss", $data['car_id'], $data['customer_name'], $data['start_date'], $data['end_date']);
            
            if ($stmt->execute()) {
                sendResponse(['success' => true, 'booking_id' => $stmt->insert_id]);
            } else {
                sendResponse(['error' => 'Booking failed'], 500);
            }
        }
        break;

    case '/api/drivers':
        if ($method === 'GET') {
            $db = getDB();
            if (!$db) sendResponse(['error' => 'Database connection failed'], 500);
            
            $result = $db->query("SELECT * FROM drivers WHERE status = 'active' LIMIT 10");
            $drivers = [];
            while ($row = $result->fetch_assoc()) {
                $drivers[] = $row;
            }
            sendResponse(['drivers' => $drivers]);
        }
        break;

    default:
        sendResponse(['error' => 'Endpoint not found'], 404);
}
