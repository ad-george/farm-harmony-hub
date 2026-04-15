-- Core Tables Only
CREATE DATABASE IF NOT EXISTS farm_management_system;
USE farm_management_system;

CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    profile_image VARCHAR(255),
    role_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE farms (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(500) NOT NULL,
    size DECIMAL(10,2),
    manager_id INT,
    description TEXT,
    established_date DATE,
    status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (manager_id) REFERENCES users(id)
);

CREATE TABLE crops (
    id INT PRIMARY KEY AUTO_INCREMENT,
    farm_id INT NOT NULL,
    crop_type VARCHAR(255) NOT NULL,
    variety VARCHAR(255),
    planting_date DATE NOT NULL,
    harvest_date DATE,
    area DECIMAL(10,2),
    expected_yield DECIMAL(10,2),
    actual_yield DECIMAL(10,2),
    status ENUM('planted', 'growing', 'flowering', 'harvesting', 'harvested', 'failed') DEFAULT 'planted',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

CREATE TABLE livestock (
    id INT PRIMARY KEY AUTO_INCREMENT,
    farm_id INT NOT NULL,
    livestock_type VARCHAR(255) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    health_status ENUM('excellent', 'good', 'fair', 'poor', 'critical') DEFAULT 'good',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

CREATE TABLE financial_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    farm_id INT NOT NULL,
    type ENUM('income', 'expense') NOT NULL,
    category VARCHAR(255) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    transaction_date DATE NOT NULL,
    recorded_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES users(id)
);

-- Insert default data
INSERT INTO roles (role_name, description) VALUES 
('Admin', 'Full system access'),
('Manager', 'Farm management access'),
('Staff', 'Limited access');

-- Default admin user (password: Admin123!)
INSERT INTO users (username, email, password_hash, full_name, role_id) VALUES 
('admin', 'admin@farm.com', '$2b$12$LQv3c1yqBWVHxRq9XwHfO.BRc6WY7n6fL9kZ8mN1pOqR2sT3uV4wXy', 'System Administrator', 1);