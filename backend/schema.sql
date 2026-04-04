-- ============================================================
-- MDS - Medical Dental System
-- Database Schema v1.1.0-beta
-- All tables use the mds_ prefix
-- ============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;

CREATE DATABASE IF NOT EXISTS mds_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mds_db;

-- ============================================================
-- USERS & AUTHENTICATION
-- ============================================================
CREATE TABLE IF NOT EXISTS mds_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  surname VARCHAR(100) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'doctor', 'receptionist') NOT NULL DEFAULT 'receptionist',
  phone VARCHAR(30),
  avatar VARCHAR(255),
  active TINYINT(1) NOT NULL DEFAULT 1,
  last_login DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Default admin user: admin@mds.com / Admin@123
INSERT IGNORE INTO mds_users (name, surname, email, password_hash, role)
VALUES ('System', 'Admin', 'admin@mds.com',
  'e86f78a8a3caf0b60d8e74e5942aa6d86dc150cd3c03338aef25b7d2d7e3acc7', 'admin');

-- ============================================================
-- PATIENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS mds_patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  birth_date DATE,
  gender ENUM('male', 'female', 'other'),
  phone VARCHAR(30),
  phone2 VARCHAR(30),
  email VARCHAR(180),
  address TEXT,
  city VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'Slovakia',
  insurance_number VARCHAR(50),
  insurance_company VARCHAR(100),
  emergency_contact_name VARCHAR(100),
  emergency_contact_phone VARCHAR(30),
  blood_type ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-','unknown') DEFAULT 'unknown',
  notes TEXT,
  warning_flags TEXT,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_by INT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES mds_users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- ALLERGIES
-- ============================================================
CREATE TABLE IF NOT EXISTS mds_allergies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  name VARCHAR(200) NOT NULL,
  severity ENUM('mild', 'moderate', 'severe', 'unknown') DEFAULT 'unknown',
  reaction TEXT,
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES mds_patients(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- MEDICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS mds_medications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  name VARCHAR(200) NOT NULL,
  dosage VARCHAR(100),
  frequency VARCHAR(100),
  prescribed_by VARCHAR(100),
  start_date DATE,
  end_date DATE,
  active TINYINT(1) DEFAULT 1,
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES mds_patients(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- DIAGNOSES
-- ============================================================
CREATE TABLE IF NOT EXISTS mds_diagnoses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  icd_code VARCHAR(20),
  description TEXT NOT NULL,
  diagnosed_by INT,
  diagnosed_at DATE,
  active TINYINT(1) DEFAULT 1,
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES mds_patients(id) ON DELETE CASCADE,
  FOREIGN KEY (diagnosed_by) REFERENCES mds_users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- TREATMENTS CATALOG
-- ============================================================
CREATE TABLE IF NOT EXISTS mds_treatments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  duration_minutes INT DEFAULT 30,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Seed common dental treatments
INSERT IGNORE INTO mds_treatments (name, category, price, duration_minutes) VALUES
  ('Examination & Consultation', 'General', 20.00, 30),
  ('X-Ray (Periapical)', 'Diagnostics', 15.00, 15),
  ('X-Ray (Panoramic)', 'Diagnostics', 40.00, 15),
  ('Professional Teeth Cleaning', 'Preventive', 60.00, 45),
  ('Fluoride Treatment', 'Preventive', 25.00, 20),
  ('Composite Filling', 'Restorative', 80.00, 45),
  ('Amalgam Filling', 'Restorative', 60.00, 45),
  ('Root Canal Treatment', 'Endodontics', 300.00, 90),
  ('Tooth Extraction (Simple)', 'Surgery', 80.00, 30),
  ('Tooth Extraction (Surgical)', 'Surgery', 150.00, 60),
  ('Crown (Porcelain)', 'Prosthodontics', 500.00, 90),
  ('Crown (Metal)', 'Prosthodontics', 300.00, 90),
  ('Bridge (per unit)', 'Prosthodontics', 450.00, 90),
  ('Dental Implant', 'Implantology', 1200.00, 120),
  ('Teeth Whitening', 'Aesthetic', 200.00, 60),
  ('Orthodontic Consultation', 'Orthodontics', 50.00, 45),
  ('Gum Treatment (Scaling)', 'Periodontics', 120.00, 60),
  ('Emergency Treatment', 'Emergency', 50.00, 30);

-- ============================================================
-- APPOINTMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS mds_appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 30,
  status ENUM('scheduled','confirmed','in_progress','completed','cancelled','no_show') DEFAULT 'scheduled',
  type VARCHAR(100),
  notes TEXT,
  cancellation_reason TEXT,
  created_by INT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES mds_patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES mds_users(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES mds_users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- MEDICAL RECORDS
-- ============================================================
CREATE TABLE IF NOT EXISTS mds_medical_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  appointment_id INT,
  visit_date DATE NOT NULL,
  chief_complaint TEXT,
  clinical_findings TEXT,
  treatment_performed TEXT,
  doctor_notes TEXT,
  follow_up_date DATE,
  follow_up_notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES mds_patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES mds_users(id) ON DELETE CASCADE,
  FOREIGN KEY (appointment_id) REFERENCES mds_appointments(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- PATIENT TREATMENTS (treatments done in a visit)
-- ============================================================
CREATE TABLE IF NOT EXISTS mds_patient_treatments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  record_id INT NOT NULL,
  patient_id INT NOT NULL,
  treatment_id INT NOT NULL,
  tooth_number VARCHAR(10),
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  notes TEXT,
  performed_by INT,
  performed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (record_id) REFERENCES mds_medical_records(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES mds_patients(id) ON DELETE CASCADE,
  FOREIGN KEY (treatment_id) REFERENCES mds_treatments(id) ON DELETE RESTRICT,
  FOREIGN KEY (performed_by) REFERENCES mds_users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- INVOICES
-- ============================================================
CREATE TABLE IF NOT EXISTS mds_invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  patient_id INT NOT NULL,
  record_id INT,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  discount_percent DECIMAL(5,2) DEFAULT 0.00,
  discount_amount DECIMAL(10,2) DEFAULT 0.00,
  total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  paid_amount DECIMAL(10,2) DEFAULT 0.00,
  balance DECIMAL(10,2) GENERATED ALWAYS AS (total - paid_amount) STORED,
  status ENUM('draft','issued','paid','partial','overdue','cancelled') DEFAULT 'draft',
  payment_method ENUM('cash','card','transfer','insurance','other'),
  issue_date DATE NOT NULL,
  due_date DATE,
  paid_date DATE,
  notes TEXT,
  created_by INT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES mds_patients(id) ON DELETE CASCADE,
  FOREIGN KEY (record_id) REFERENCES mds_medical_records(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES mds_users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- FILES / ATTACHMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS mds_files (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  record_id INT,
  file_uuid VARCHAR(36) NOT NULL UNIQUE,
  stored_name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100),
  size_bytes BIGINT,
  category ENUM('xray','photo','document','lab_result','consent','other') DEFAULT 'other',
  description TEXT,
  uploaded_by INT,
  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES mds_patients(id) ON DELETE CASCADE,
  FOREIGN KEY (record_id) REFERENCES mds_medical_records(id) ON DELETE SET NULL,
  FOREIGN KEY (uploaded_by) REFERENCES mds_users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS mds_notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  type ENUM('appointment','allergy','payment','system','reminder','warning') DEFAULT 'system',
  title VARCHAR(255) NOT NULL,
  message TEXT,
  entity VARCHAR(50),
  entity_id INT,
  is_read TINYINT(1) DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES mds_users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- ACTIVITY LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS mds_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  entity VARCHAR(50),
  entity_id INT,
  details JSON,
  ip_address VARCHAR(45),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES mds_users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

SET foreign_key_checks = 1;

-- ============================================================
-- INVENTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS mds_inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  stock DECIMAL(10,2) DEFAULT 0,
  min_stock DECIMAL(10,2) DEFAULT 0,
  price DECIMAL(10,2) DEFAULT 0,
  supplier VARCHAR(100),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- ODONTOGRAM (Dental Chart)
-- ============================================================
CREATE TABLE IF NOT EXISTS mds_odontogram (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  tooth_number INT NOT NULL,
  state ENUM('healthy', 'decayed', 'filled', 'missing', 'crown', 'bridge', 'implant', 'endodontic') DEFAULT 'healthy',
  notes TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES mds_patients(id) ON DELETE CASCADE,
-- ============================================================
-- PAIRING (Client Device Connection)
-- ============================================================
CREATE TABLE IF NOT EXISTS mds_pairing (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pairing_code VARCHAR(10) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- PRESCRIPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS mds_prescriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  date DATE NOT NULL,
  medications TEXT NOT NULL, -- JSON or comma-separated list
  instructions TEXT,
  valid_until DATE,
  status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES mds_patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES mds_users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- LABORATORY WORK
-- ============================================================
CREATE TABLE IF NOT EXISTS mds_lab_work (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  lab_name VARCHAR(200) NOT NULL,
  work_type VARCHAR(100) NOT NULL, -- e.g. Crown, Bridge, Denture
  tooth_number VARCHAR(20),
  shade VARCHAR(50),
  order_date DATE NOT NULL,
  due_date DATE,
  received_date DATE,
  cost DECIMAL(10,2) DEFAULT 0.00,
  status ENUM('ordered', 'in_transit', 'received', 'fitted', 'failed', 'cancelled') DEFAULT 'ordered',
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES mds_patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES mds_users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- TREATMENT PLANS
-- ============================================================
CREATE TABLE IF NOT EXISTS mds_treatment_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  total_estimated_cost DECIMAL(10,2) DEFAULT 0.00,
  status ENUM('draft', 'active', 'completed', 'cancelled') DEFAULT 'draft',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES mds_patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES mds_users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS mds_treatment_plan_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plan_id INT NOT NULL,
  treatment_id INT NOT NULL,
  phase_number INT DEFAULT 1,
  tooth_number VARCHAR(10),
  notes TEXT,
  status ENUM('pending', 'completed', 'skipped') DEFAULT 'pending',
  payment_status ENUM('unpaid', 'paid', 'waived') DEFAULT 'unpaid',
  invoice_id INT NULL,
  FOREIGN KEY (plan_id) REFERENCES mds_treatment_plans(id) ON DELETE CASCADE,
  FOREIGN KEY (treatment_id) REFERENCES mds_treatments(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ============================================================
-- SYSTEM SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS mds_settings (
  setting_key VARCHAR(100) PRIMARY KEY,
  setting_value TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT IGNORE INTO mds_settings (setting_key, setting_value) VALUES 
('invoice_template', '["header", "clinic_info", "patient_info", "treatment_table", "totals", "footer"]');

SET foreign_key_checks = 1;
