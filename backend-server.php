<?php
/**
 * Car Rental Backend Server
 * Complete REST API for Car Rental System
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

class CarRentalAPI {
    private $db;
    
    public function __construct() {
        $this->connectDB();
        $this->setCORS();
    }
    
    private function connectDB() {
        $this->db = @new mysqli('localhost', 'root', '', 'car_rental');
        if ($this->db->connect_error) {
            $this->db = null;
        }
    }
    
    private function setCORS() {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        header('Content-Type: application/json');
        
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit();
        }
    }
    
    private function response($data, $code = 200) {
        http_response_code($code);
        echo json_encode($data);
        exit();
    }
    
    public function handleRequest() {
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $method = $_SERVER['REQUEST_METHOD'];
        
        // Remove /api prefix if present
        $path = preg_replace('#^/api#', '', $path);
        
        switch ($path) {
            case '/':
            case '/status':
                $this->getStatus();
                break;
            
            case '/cars':
                $method === 'GET' ? $this->getCars() : $this->response(['error' => 'Method not allowed'], 405);
                break;
            
            case '/cars/available':
                $this->getAvailableCars();
                break;
            
            case '/bookings':
                if ($method === 'GET') $this->getBookings();
                elseif ($method === 'POST') $this->createBooking();
                else $this->response(['error' => 'Method not allowed'], 405);
                break;
            
            case '/drivers':
                $this->getDrivers();
                break;
            
            case '/customers':
                if ($method === 'GET') $this->getCustomers();
                elseif ($method === 'POST') $this->createCustomer();
                else $this->response(['error' => 'Method not allowed'], 405);
                break;
            
            default:
                $this->response(['error' => 'Endpoint not found', 'path' => $path], 404);
        }
    }
    
    private function getStatus() {
        $this->response([
            'status' => 'online',
            'version' => '1.0.0',
            'database' => $this->db ? 'connected' : 'disconnected',
            'timestamp' => date('Y-m-d H:i:s'),
            'endpoints' => [
                'GET /status',
                'GET /cars',
                'GET /cars/available',
                'GET /bookings',
                'POST /bookings',
                'GET /drivers',
                'GET /customers',
                'POST /customers'
            ]
        ]);
    }
    
    private function getCars() {
        if (!$this->db) {
            $this->response(['error' => 'Database not connected'], 500);
        }
        
        $result = $this->db->query("SELECT * FROM cars LIMIT 50");
        if (!$result) {
            $this->response([
                'cars' => [],
                'message' => 'Table may not exist yet'
            ]);
        }
        
        $cars = [];
        while ($row = $result->fetch_assoc()) {
            $cars[] = $row;
        }
        
        $this->response(['cars' => $cars, 'count' => count($cars)]);
    }
    
    private function getAvailableCars() {
        if (!$this->db) {
            $this->response(['error' => 'Database not connected'], 500);
        }
        
        $result = $this->db->query("SELECT * FROM cars WHERE status = 'available' LIMIT 50");
        if (!$result) {
            $this->response(['cars' => [], 'message' => 'No available cars']);
        }
        
        $cars = [];
        while ($row = $result->fetch_assoc()) {
            $cars[] = $row;
        }
        
        $this->response(['cars' => $cars, 'count' => count($cars)]);
    }
    
    private function getBookings() {
        if (!$this->db) {
            $this->response(['error' => 'Database not connected'], 500);
        }
        
        $result = $this->db->query("SELECT * FROM bookings ORDER BY created_at DESC LIMIT 50");
        if (!$result) {
            $this->response(['bookings' => [], 'message' => 'No bookings found']);
        }
        
        $bookings = [];
        while ($row = $result->fetch_assoc()) {
            $bookings[] = $row;
        }
        
        $this->response(['bookings' => $bookings, 'count' => count($bookings)]);
    }
    
    private function createBooking() {
        if (!$this->db) {
            $this->response(['error' => 'Database not connected'], 500);
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['car_id']) || !isset($data['customer_name'])) {
            $this->response(['error' => 'Missing required fields'], 400);
        }
        
        $stmt = $this->db->prepare("INSERT INTO bookings (car_id, customer_name, start_date, end_date, status) VALUES (?, ?, ?, ?, 'pending')");
        $stmt->bind_param("isss", 
            $data['car_id'], 
            $data['customer_name'], 
            $data['start_date'] ?? date('Y-m-d'),
            $data['end_date'] ?? date('Y-m-d', strtotime('+7 days'))
        );
        
        if ($stmt->execute()) {
            $this->response([
                'success' => true,
                'booking_id' => $stmt->insert_id,
                'message' => 'Booking created successfully'
            ], 201);
        } else {
            $this->response(['error' => 'Failed to create booking'], 500);
        }
    }
    
    private function getDrivers() {
        if (!$this->db) {
            $this->response(['error' => 'Database not connected'], 500);
        }
        
        $result = $this->db->query("SELECT * FROM drivers LIMIT 50");
        if (!$result) {
            $this->response(['drivers' => [], 'message' => 'No drivers found']);
        }
        
        $drivers = [];
        while ($row = $result->fetch_assoc()) {
            $drivers[] = $row;
        }
        
        $this->response(['drivers' => $drivers, 'count' => count($drivers)]);
    }
    
    private function getCustomers() {
        if (!$this->db) {
            $this->response(['error' => 'Database not connected'], 500);
        }
        
        $result = $this->db->query("SELECT * FROM customers LIMIT 50");
        if (!$result) {
            $this->response(['customers' => [], 'message' => 'No customers found']);
        }
        
        $customers = [];
        while ($row = $result->fetch_assoc()) {
            $customers[] = $row;
        }
        
        $this->response(['customers' => $customers, 'count' => count($customers)]);
    }
    
    private function createCustomer() {
        if (!$this->db) {
            $this->response(['error' => 'Database not connected'], 500);
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['name']) || !isset($data['email'])) {
            $this->response(['error' => 'Missing required fields'], 400);
        }
        
        $stmt = $this->db->prepare("INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)");
        $stmt->bind_param("sss", $data['name'], $data['email'], $data['phone'] ?? '');
        
        if ($stmt->execute()) {
            $this->response([
                'success' => true,
                'customer_id' => $stmt->insert_id,
                'message' => 'Customer created successfully'
            ], 201);
        } else {
            $this->response(['error' => 'Failed to create customer'], 500);
        }
    }
}

// Run the API
$api = new CarRentalAPI();
$api->handleRequest();
