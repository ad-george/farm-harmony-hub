USE farm_management_system;

-- Insert sample farms
INSERT INTO farms (name, location, size, established_date, status) VALUES
('Green Valley Farm', '123 Farm Road, Rural County', 150.50, '2015-03-15', 'active'),
('Sunrise Orchards', '456 Orchard Lane, Hill District', 85.75, '2018-06-20', 'active'),
('Riverbend Ranch', '789 Ranch Road, Valley Region', 320.25, '2010-11-05', 'active'),
('Mountain View Farm', '321 Highland Drive, Mountain Area', 65.00, '2020-02-10', 'active');

-- Insert sample crops
INSERT INTO crops (farm_id, crop_type_id, variety, planting_date, area, status) VALUES
(1, 1, 'Hybrid Maize', CURDATE() - INTERVAL 30 DAY, 50.00, 'growing'),
(1, 4, 'Cherry Tomatoes', CURDATE() - INTERVAL 45 DAY, 10.00, 'flowering'),
(2, 5, 'Russet Potatoes', CURDATE() - INTERVAL 60 DAY, 25.00, 'growing'),
(3, 2, 'Winter Wheat', CURDATE() - INTERVAL 90 DAY, 150.00, 'harvesting');

-- Insert sample livestock
INSERT INTO livestock (farm_id, livestock_type_id, quantity, health_status) VALUES
(1, 1, 50, 'good'),
(1, 3, 200, 'excellent'),
(3, 2, 120, 'good'),
(4, 6, 45, 'fair');

-- Insert sample financial records
INSERT INTO financial_records (farm_id, category_id, transaction_date, amount, description, recorded_by) VALUES
(1, 1, CURDATE() - INTERVAL 10 DAY, 15000.00, 'Maize sales for Q1', 1),
(1, 10, CURDATE() - INTERVAL 5 DAY, 5000.00, 'Monthly labor costs', 1),
(2, 1, CURDATE() - INTERVAL 15 DAY, 8500.00, 'Potato harvest sales', 1),
(3, 2, CURDATE() - INTERVAL 7 DAY, 22000.00, 'Beef cattle auction', 1);

-- Insert sample equipment
INSERT INTO equipment (farm_id, name, equipment_type, model, status) VALUES
(1, 'John Deere Tractor', 'Tractor', '8R 410', 'operational'),
(1, 'Combine Harvester', 'Harvester', 'S790', 'operational'),
(2, 'Irrigation Pump', 'Pump', 'JP-1500', 'maintenance');

-- Insert sample inventory
INSERT INTO inventory_items (farm_id, name, category, unit, current_quantity, minimum_quantity) VALUES
(1, 'NPK Fertilizer', 'Fertilizer', 'bags', 150.00, 50.00),
(1, 'Seeds - Maize', 'Seeds', 'kg', 500.00, 100.00),
(1, 'Animal Feed', 'Feed', 'tons', 12.50, 5.00),
(1, 'Diesel Fuel', 'Fuel', 'liters', 2000.00, 500.00);

-- Insert sample tasks
INSERT INTO tasks (farm_id, assigned_to, title, description, status, due_date) VALUES
(1, NULL, 'Apply fertilizer to maize field', 'Apply NPK fertilizer to sections A and B', 'pending', CURDATE() + INTERVAL 2 DAY),
(1, NULL, 'Check irrigation system', 'Inspect all sprinklers for leaks', 'in_progress', CURDATE() + INTERVAL 1 DAY),
(2, NULL, 'Harvest potatoes', 'Harvest potato field #3', 'pending', CURDATE() + INTERVAL 5 DAY);