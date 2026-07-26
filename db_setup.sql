-- Voice-Based Transport Enquiry System Database Schema & Data

CREATE DATABASE IF NOT EXISTS transport_enquiry_db;
USE transport_enquiry_db;

-- --------------------------------------------------------
-- 1. Table: Users
-- --------------------------------------------------------
DROP TABLE IF EXISTS Queries;
DROP TABLE IF EXISTS Transport;
DROP TABLE IF EXISTS Users;

CREATE TABLE Users ( 
    user_id INT AUTO_INCREMENT PRIMARY KEY, 
    name VARCHAR(100) NOT NULL, 
    contact VARCHAR(15) NOT NULL,
    last_query_time DATETIME
);

-- Insert 50 users
INSERT INTO Users (name, contact) VALUES  
('Sita', '9876543210'), 
('Rama', '9876543211'), 
('Krishna', '9876543212'), 
('Arjun', '9876543213'), 
('Bheem', '9876543214'), 
('Nakul', '9876543215'), 
('Sahadev', '9876543216'), 
('Draupadi', '9876543217'), 
('Kunti', '9876543218'), 
('Duryodhan', '9876543219'), 
('Dushasan', '9876543220'), 
('Karna', '9876543221'), 
('Ashwatthama', '9876543222'), 
('Abhimanyu', '9876543223'), 
('Parikshit', '9876543224'), 
('Subhadra', '9876543225'), 
('Balram', '9876543226'), 
('Uddhav', '9876543227'), 
('Vidur', '9876543228'), 
('Shakuni', '9876543229'), 
('Gandhari', '9876543230'), 
('Dhritarashtra', '9876543231'), 
('Yudhishthir', '9876543232'), 
('Bhishma', '9876543233'), 
('Dron', '9876543234'), 
('Shikhandi', '9876543235'), 
('Jayadrath', '9876543236'), 
('Virat', '9876543237'), 
('Ugrasen', '9876543238'), 
('Devaki', '9876543239'), 
('Vasudev', '9876543240'), 
('Nanda', '9876543241'), 
('Yashoda', '9876543242'), 
('Radha', '9876543243'), 
('Rukmini', '9876543244'), 
('Satyabhama', '9876543245'), 
('Jambavati', '9876543246'), 
('Kalindi', '9876543247'), 
('Mitravinda', '9876543248'), 
('Nagnajiti', '9876543249'), 
('Bhadra', '9876543250'), 
('Lakshman', '9876543251'), 
('Bharat', '9876543252'), 
('Shatrughna', '9876543253'), 
('Hanuman', '9876543254'), 
('Sugriva', '9876543255'), 
('Angad', '9876543256'), 
('Jambavan', '9876543257'),
('Vibhishan', '9876543258'),
('Guha', '9876543259');

-- --------------------------------------------------------
-- 2. Table: Transport
-- --------------------------------------------------------
CREATE TABLE Transport ( 
    transport_id INT AUTO_INCREMENT PRIMARY KEY, 
    type VARCHAR(50) NOT NULL, 
    route VARCHAR(255) NOT NULL, 
    departure_time TIME NOT NULL, 
    arrival_time TIME NOT NULL, 
    capacity INT, 
    fare DECIMAL(10,2) 
);

-- Insert 50 transport routes
INSERT INTO Transport (type, route, departure_time, arrival_time, capacity, fare) 
VALUES  
('Bus', 'Guntur to Vijayawada', '08:00:00', '10:30:00', 50, 120.00), 
('Bus', 'Vijayawada to Guntur', '11:00:00', '13:30:00', 50, 120.00), 
('Bus', 'Hyderabad to Vijayawada', '06:00:00', '12:00:00', 50, 350.00), 
('Bus', 'Vijayawada to Hyderabad', '13:00:00', '19:00:00', 50, 350.00), 
('Bus', 'Guntur to Hyderabad', '07:00:00', '13:30:00', 50, 400.00), 
('Bus', 'Hyderabad to Guntur', '14:00:00', '20:30:00', 50, 400.00), 
('Train', 'Guntur to Vijayawada', '09:00:00', '10:00:00', 500, 80.00), 
('Train', 'Vijayawada to Guntur', '11:00:00', '12:00:00', 500, 80.00), 
('Train', 'Hyderabad to Vijayawada', '08:00:00', '12:30:00', 500, 250.00), 
('Train', 'Vijayawada to Hyderabad', '13:30:00', '18:00:00', 500, 250.00), 
('Train', 'Guntur to Hyderabad', '10:00:00', '15:30:00', 500, 300.00), 
('Train', 'Hyderabad to Guntur', '16:00:00', '21:30:00', 500, 300.00), 
('Bus', 'Vijayawada to Visakhapatnam', '05:00:00', '14:00:00', 50, 600.00), 
('Bus', 'Visakhapatnam to Vijayawada', '15:00:00', '23:59:00', 50, 600.00), 
('Train', 'Vijayawada to Visakhapatnam', '06:00:00', '12:00:00', 500, 400.00), 
('Train', 'Visakhapatnam to Vijayawada', '13:00:00', '19:00:00', 500, 400.00), 
('Bus', 'Guntur to Chennai', '20:00:00', '23:59:00', 50, 900.00), 
('Bus', 'Chennai to Guntur', '21:00:00', '23:59:00', 50, 900.00), 
('Train', 'Guntur to Chennai', '19:00:00', '23:59:00', 500, 600.00), 
('Train', 'Chennai to Guntur', '20:00:00', '23:59:00', 500, 600.00), 
('Bus', 'Vijayawada to Bengaluru', '18:00:00', '23:59:00', 50, 1000.00), 
('Bus', 'Bengaluru to Vijayawada', '19:00:00', '23:59:00', 50, 1000.00), 
('Train', 'Vijayawada to Bengaluru', '17:00:00', '23:59:00', 500, 700.00), 
('Train', 'Bengaluru to Vijayawada', '18:00:00', '23:59:00', 500, 700.00), 
('Bus', 'Guntur to Tirupati', '06:00:00', '14:00:00', 50, 500.00), 
('Bus', 'Tirupati to Guntur', '15:00:00', '23:00:00', 50, 500.00), 
('Train', 'Guntur to Tirupati', '07:00:00', '13:00:00', 500, 350.00), 
('Train', 'Tirupati to Guntur', '14:00:00', '20:00:00', 500, 350.00), 
('Bus', 'Vijayawada to Nellore', '08:00:00', '14:00:00', 50, 400.00), 
('Bus', 'Nellore to Vijayawada', '15:00:00', '21:00:00', 50, 400.00), 
('Train', 'Vijayawada to Nellore', '09:00:00', '13:00:00', 500, 250.00), 
('Train', 'Nellore to Vijayawada', '14:00:00', '18:00:00', 500, 250.00), 
('Bus', 'Guntur to Kurnool', '07:00:00', '14:00:00', 50, 450.00), 
('Bus', 'Kurnool to Guntur', '15:00:00', '22:00:00', 50, 450.00), 
('Train', 'Guntur to Kurnool', '08:00:00', '13:00:00', 500, 300.00), 
('Train', 'Kurnool to Guntur', '14:00:00', '19:00:00', 500, 300.00), 
('Bus', 'Vijayawada to Rajahmundry', '06:00:00', '11:00:00', 50, 300.00), 
('Bus', 'Rajahmundry to Vijayawada', '12:00:00', '17:00:00', 50, 300.00), 
('Train', 'Vijayawada to Rajahmundry', '07:00:00', '10:00:00', 500, 200.00), 
('Train', 'Rajahmundry to Vijayawada', '11:00:00', '14:00:00', 500, 200.00), 
('Bus', 'Guntur to Ongole', '08:00:00', '11:00:00', 50, 200.00), 
('Bus', 'Ongole to Guntur', '12:00:00', '15:00:00', 50, 200.00), 
('Train', 'Guntur to Ongole', '09:00:00', '11:00:00', 500, 150.00), 
('Train', 'Ongole to Guntur', '12:00:00', '14:00:00', 500, 150.00), 
('Bus', 'Vijayawada to Eluru', '07:00:00', '09:00:00', 50, 100.00), 
('Bus', 'Eluru to Vijayawada', '10:00:00', '12:00:00', 50, 100.00), 
('Train', 'Vijayawada to Eluru', '08:00:00', '09:00:00', 500, 80.00), 
('Train', 'Eluru to Vijayawada', '10:00:00', '11:00:00', 500, 80.00),
('Bus', 'Guntur to Visakhapatnam', '06:00:00', '15:00:00', 50, 650.00),
('Train', 'Bengaluru to Guntur', '16:00:00', '23:30:00', 500, 680.00);

-- --------------------------------------------------------
-- 3. Table: Queries
-- --------------------------------------------------------
CREATE TABLE Queries ( 
    query_id INT AUTO_INCREMENT PRIMARY KEY, 
    user_id INT NOT NULL, 
    transport_id INT NOT NULL, 
    query_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    FOREIGN KEY (user_id) REFERENCES Users(user_id), 
    FOREIGN KEY (transport_id) REFERENCES Transport(transport_id) 
);

-- Insert 50 queries
INSERT INTO Queries (user_id, transport_id, query_time) VALUES  
(1, 1, '2025-04-07 07:45:00'), 
(2, 3, '2025-04-07 05:30:00'), 
(3, 5, '2025-04-07 06:15:00'), 
(4, 7, '2025-04-07 08:30:00'), 
(5, 9, '2025-04-07 07:00:00'), 
(6, 11, '2025-04-07 09:15:00'), 
(7, 13, '2025-04-07 04:30:00'), 
(8, 15, '2025-04-07 05:45:00'), 
(9, 17, '2025-04-07 19:30:00'), 
(10, 19, '2025-04-07 18:15:00'), 
(11, 21, '2025-04-07 17:30:00'), 
(12, 23, '2025-04-07 16:45:00'), 
(13, 25, '2025-04-07 05:30:00'), 
(14, 27, '2025-04-07 06:45:00'), 
(15, 29, '2025-04-07 07:30:00'), 
(16, 31, '2025-04-07 08:15:00'), 
(17, 33, '2025-04-07 06:30:00'), 
(18, 35, '2025-04-07 07:45:00'), 
(19, 37, '2025-04-07 05:30:00'), 
(20, 39, '2025-04-07 06:15:00'), 
(21, 41, '2025-04-07 07:30:00'), 
(22, 43, '2025-04-07 06:45:00'), 
(23, 45, '2025-04-07 07:00:00'), 
(24, 47, '2025-04-07 06:30:00'), 
(25, 49, '2025-04-07 07:15:00'), 
(1, 2, '2025-04-07 10:30:00'), 
(2, 4, '2025-04-07 12:15:00'), 
(3, 6, '2025-04-07 13:30:00'), 
(4, 8, '2025-04-07 10:45:00'), 
(5, 10, '2025-04-07 12:00:00'), 
(6, 12, '2025-04-07 15:15:00'), 
(7, 14, '2025-04-07 14:30:00'), 
(8, 16, '2025-04-07 12:45:00'), 
(9, 18, '2025-04-07 20:30:00'), 
(10, 20, '2025-04-07 19:45:00'), 
(11, 22, '2025-04-07 18:00:00'), 
(12, 24, '2025-04-07 17:15:00'), 
(13, 26, '2025-04-07 13:30:00'), 
(14, 28, '2025-04-07 12:45:00'), 
(15, 30, '2025-04-07 14:00:00'), 
(16, 32, '2025-04-07 13:15:00'), 
(17, 34, '2025-04-07 14:30:00'), 
(18, 36, '2025-04-07 13:45:00'), 
(19, 38, '2025-04-07 11:30:00'), 
(20, 40, '2025-04-07 12:15:00'), 
(21, 42, '2025-04-07 13:30:00'), 
(22, 44, '2025-04-07 12:45:00'), 
(23, 46, '2025-04-07 14:00:00'), 
(24, 48, '2025-04-07 13:15:00'), 
(25, 50, '2025-04-07 14:30:00'); 

-- --------------------------------------------------------
-- 4. Triggers
-- --------------------------------------------------------

-- 1) Validate user contact format (10 digits)
DELIMITER // 
CREATE TRIGGER validate_user_contact 
BEFORE INSERT ON Users 
FOR EACH ROW 
BEGIN 
    IF NEW.contact NOT REGEXP '^[0-9]{10}$' THEN 
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Contact number must be exactly 10 digits'; 
    END IF; 
END // 
DELIMITER ;

-- 2) Prevent invalid transport timings
DELIMITER // 
CREATE TRIGGER validate_transport_timing 
BEFORE INSERT ON Transport 
FOR EACH ROW 
BEGIN 
    IF NEW.departure_time >= NEW.arrival_time THEN 
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Arrival time must be after departure time'; 
    END IF; 
END // 
DELIMITER ;

-- 3) Notify when popular route is queried
DELIMITER // 
CREATE TRIGGER notify_popular_route 
AFTER INSERT ON Queries 
FOR EACH ROW 
BEGIN 
    DECLARE query_count INT; 
    DECLARE route_info VARCHAR(255); 
    SELECT COUNT(*) INTO query_count FROM Queries WHERE transport_id = NEW.transport_id; 
    SELECT CONCAT(type, ' ', route) INTO route_info FROM Transport WHERE transport_id = NEW.transport_id; 
    IF query_count > 5 THEN 
        SET @popular_route_notification = CONCAT('Popular route: ', route_info, ' has ', query_count, ' enquiries'); 
    END IF; 
END // 
DELIMITER ;

-- 4) Prevent overcapacity
DELIMITER // 
CREATE TRIGGER prevent_overcapacity 
BEFORE INSERT ON Queries 
FOR EACH ROW 
BEGIN 
    DECLARE current_capacity INT; 
    SELECT capacity INTO current_capacity FROM Transport WHERE transport_id = NEW.transport_id; 
    IF current_capacity <= 0 THEN 
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'This transport is already at full capacity'; 
    END IF; 
END // 
DELIMITER ;

-- 5) Update last query time for user
DELIMITER // 
CREATE TRIGGER update_user_last_query 
AFTER INSERT ON Queries 
FOR EACH ROW 
BEGIN 
    UPDATE Users 
    SET last_query_time = NOW() 
    WHERE user_id = NEW.user_id; 
END // 
DELIMITER ;

-- 6) Validate transport type
DELIMITER // 
CREATE TRIGGER validate_transport_type 
BEFORE INSERT ON Transport 
FOR EACH ROW 
BEGIN 
    IF NEW.type NOT IN ('Bus', 'Train') THEN 
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Transport type must be either Bus or Train'; 
    END IF; 
END // 
DELIMITER ;

-- --------------------------------------------------------
-- 5. Functions and Stored Procedures
-- --------------------------------------------------------

-- 1) Fetch next available transport
DELIMITER // 
CREATE FUNCTION get_next_available_transport(p_route VARCHAR(255), p_time TIME)  
RETURNS INT 
DETERMINISTIC 
BEGIN 
    DECLARE next_transport_id INT; 
    SELECT transport_id INTO next_transport_id 
    FROM Transport 
    WHERE route = p_route AND departure_time > p_time 
    ORDER BY departure_time 
    LIMIT 1; 
    RETURN next_transport_id; 
END // 
DELIMITER ;

-- 2) Procedure to log user queries
DELIMITER // 
CREATE PROCEDURE log_user_query(IN p_user_id INT, IN p_transport_id INT) 
BEGIN 
    INSERT INTO Queries (user_id, transport_id) VALUES (p_user_id, p_transport_id); 
END // 
DELIMITER ;

-- 3) Function to calculate journey time
DELIMITER // 
CREATE FUNCTION calculate_journey_time(p_transport_id INT)  
RETURNS TIME 
DETERMINISTIC 
BEGIN 
    DECLARE dep_time TIME; 
    DECLARE arr_time TIME; 
    DECLARE journey_time TIME; 
    SELECT departure_time, arrival_time INTO dep_time, arr_time 
    FROM Transport 
    WHERE transport_id = p_transport_id; 
    SET journey_time = TIMEDIFF(arr_time, dep_time); 
    RETURN journey_time; 
END // 
DELIMITER ;

-- --------------------------------------------------------
-- 6. Views
-- --------------------------------------------------------

-- View 1: Daily user queries summary
CREATE OR REPLACE VIEW daily_user_queries AS 
SELECT DATE(query_time) AS query_date, COUNT(*) AS total_queries 
FROM Queries 
GROUP BY DATE(query_time);

-- View 2: Transport usage analytics
CREATE OR REPLACE VIEW transport_usage AS 
SELECT t.type, t.route, COUNT(q.query_id) AS query_count 
FROM Transport t 
LEFT JOIN Queries q ON t.transport_id = q.transport_id 
GROUP BY t.type, t.route 
ORDER BY query_count DESC;

-- View 3: Frequently queried routes
CREATE OR REPLACE VIEW frequent_routes AS 
SELECT t.route, COUNT(q.query_id) AS query_count 
FROM Transport t 
JOIN Queries q ON t.transport_id = q.transport_id 
GROUP BY t.route 
ORDER BY query_count DESC 
LIMIT 10;
