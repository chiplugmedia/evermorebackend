-- Migration: 001_free_registration_and_admin.sql
-- Purpose: Add username, role, status to registrations & users, set admin role for chiplugtv@gmail.com, and enable FREE registrations

USE chiplug_invest;

-- 1. Modify payment_status enum in registrations to allow 'FREE'
ALTER TABLE registrations 
MODIFY COLUMN payment_status ENUM('PENDING','PAID','FAILED','FREE') DEFAULT 'FREE';

-- 2. Add username, role, status to registrations table if they do not exist
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'chiplug_invest' AND TABLE_NAME = 'registrations' AND COLUMN_NAME = 'username');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE registrations ADD COLUMN username VARCHAR(100) NULL AFTER fullname', 'SELECT "username already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'chiplug_invest' AND TABLE_NAME = 'registrations' AND COLUMN_NAME = 'role');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE registrations ADD COLUMN role ENUM(\'user\', \'admin\') NOT NULL DEFAULT \'user\' AFTER email', 'SELECT "role already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'chiplug_invest' AND TABLE_NAME = 'registrations' AND COLUMN_NAME = 'status');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE registrations ADD COLUMN status ENUM(\'active\', \'suspended\', \'pending\') NOT NULL DEFAULT \'active\' AFTER payment_status', 'SELECT "status already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3. Update existing users: set usernames where missing and ensure administrator role for chiplugtv@gmail.com
UPDATE registrations 
SET username = CONCAT('user_', id) 
WHERE username IS NULL OR username = '';

UPDATE registrations 
SET username = 'chiplugtv' 
WHERE email = 'chiplugtv@gmail.com' AND (username IS NULL OR username LIKE 'user_%');

UPDATE registrations 
SET role = 'admin', status = 'active' 
WHERE email = 'chiplugtv@gmail.com';

-- 4. Update users table columns to support Free plan, role, username, status
ALTER TABLE users 
MODIFY COLUMN plan ENUM('Trial','Premium','Free') NOT NULL DEFAULT 'Free';

ALTER TABLE users 
MODIFY COLUMN payment_status ENUM('pending','paid','failed','free') DEFAULT 'free';

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'chiplug_invest' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'username');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE users ADD COLUMN username VARCHAR(100) NULL AFTER fullname', 'SELECT "users.username already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'chiplug_invest' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE users ADD COLUMN role ENUM(\'user\', \'admin\') NOT NULL DEFAULT \'user\' AFTER email', 'SELECT "users.role already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'chiplug_invest' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'status');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE users ADD COLUMN status ENUM(\'active\', \'suspended\') NOT NULL DEFAULT \'active\' AFTER payment_status', 'SELECT "users.status already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 5. Sync existing distinct registration accounts into users table if users is empty
INSERT IGNORE INTO users (fullname, username, phone, email, role, plan, password, amount, payment_status, status, created_at)
SELECT 
    r.fullname,
    r.username,
    r.phone,
    r.email,
    r.role,
    CASE 
        WHEN r.plan IN ('Trial', 'Premium', 'Free') THEN r.plan
        ELSE 'Free'
    END AS plan,
    r.password,
    r.amount,
    CASE
        WHEN r.payment_status = 'PAID' THEN 'paid'
        WHEN r.payment_status = 'FREE' THEN 'free'
        WHEN r.payment_status = 'FAILED' THEN 'failed'
        ELSE 'pending'
    END AS payment_status,
    r.status,
    r.created_at
FROM registrations r
WHERE r.id IN (
    SELECT MAX(id) FROM registrations GROUP BY email
)
ON DUPLICATE KEY UPDATE 
    role = VALUES(role),
    status = VALUES(status),
    username = VALUES(username);
