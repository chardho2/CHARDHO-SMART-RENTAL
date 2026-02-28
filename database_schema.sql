-- Chardho Car Rental System - Finalized Database Schema
-- Created: 2026-02-26
-- Optimized for CodeIgniter 3 ExpressGo Theme

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- --------------------------------------------------------

-- Table structure for table `admin`
CREATE TABLE IF NOT EXISTS `admin` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `login` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Dumping data for table `admin`
INSERT INTO `admin` (`id`, `login`, `password`) VALUES
(1, 'admin', 'admin123');

-- --------------------------------------------------------

-- Table structure for table `setup`
CREATE TABLE IF NOT EXISTS `setup` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `parameter` varchar(255) NOT NULL,
  `value` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Dumping data for table `setup`
INSERT INTO `setup` (`parameter`, `value`) VALUES
('language', 'english'),
('install', '1'),
('tax', '18'),
('currency', 'INR'),
('company_name', 'Chardho Car Rental'),
('company_email', 'contact@chardho.com');

-- --------------------------------------------------------

-- Table structure for table `branch`
CREATE TABLE IF NOT EXISTS `branch` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `address` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Dumping data for table `branch`
INSERT INTO `branch` (`id`, `name`, `address`) VALUES
(1, 'Main Branch', 'City Center, New Delhi');

-- --------------------------------------------------------

-- Table structure for table `vehicle_class`
CREATE TABLE IF NOT EXISTS `vehicle_class` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Dumping data for table `vehicle_class`
INSERT INTO `vehicle_class` (`id`, `name`) VALUES
(1, 'Economy'),
(2, 'Luxury'),
(3, 'SUV');

-- --------------------------------------------------------

-- Table structure for table `vehicles`
CREATE TABLE IF NOT EXISTS `vehicles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `branch_id` int(11) DEFAULT NULL,
  `license_plate` varchar(50) NOT NULL,
  `vin` varchar(50) DEFAULT NULL,
  `make` varchar(255) NOT NULL,
  `model` varchar(255) NOT NULL,
  `year` varchar(4) DEFAULT NULL,
  `color` varchar(50) DEFAULT NULL,
  `class` int(11) DEFAULT NULL,
  `transmission` varchar(50) DEFAULT NULL,
  `engine` varchar(50) DEFAULT NULL,
  `fuel_type` varchar(50) DEFAULT NULL,
  `1day` decimal(10,2) DEFAULT '0.00',
  `weekly` decimal(10,2) DEFAULT '0.00',
  `monthly` decimal(10,2) DEFAULT '0.00',
  `available` tinyint(1) DEFAULT '0',
  `image` varchar(255) DEFAULT 'ertiga.png',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

-- Table structure for table `clients`
CREATE TABLE IF NOT EXISTS `clients` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `id_number` varchar(100) DEFAULT NULL,
  `address` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

-- Table structure for table `drivers`
CREATE TABLE IF NOT EXISTS `drivers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `client_id` int(11) NOT NULL,
  `first_name` varchar(255) DEFAULT NULL,
  `last_name` varchar(255) DEFAULT NULL,
  `license_number` varchar(100) DEFAULT NULL,
  `license_expiry` date DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

-- Table structure for table `agreements`
CREATE TABLE IF NOT EXISTS `agreements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `vehicle_id` int(11) NOT NULL,
  `client_id` int(11) NOT NULL,
  `date_out` date DEFAULT NULL,
  `date_in` date DEFAULT NULL,
  `time_out` time DEFAULT NULL,
  `time_in` time DEFAULT NULL,
  `km_out` int(11) DEFAULT NULL,
  `km_in` int(11) DEFAULT NULL,
  `fuel_out` varchar(50) DEFAULT NULL,
  `fuel_in` varchar(50) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'open',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

-- Table structure for table `invoices`
CREATE TABLE IF NOT EXISTS `invoices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `agr_id` int(11) NOT NULL,
  `total` decimal(10,2) DEFAULT '0.00',
  `tax` decimal(10,2) DEFAULT '0.00',
  `subtotal` decimal(10,2) DEFAULT '0.00',
  `payment_status` varchar(50) DEFAULT 'unpaid',
  `vehicle_status` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

-- Table structure for table `payments`
CREATE TABLE IF NOT EXISTS `payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `invoice_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `date` date NOT NULL,
  `method` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
