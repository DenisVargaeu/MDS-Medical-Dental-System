require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const db = require('../src/config/db');

async function migrate() {
  console.log('--- MDS DATABASE MIGRATION ---');
  try {
    const queries = [
      `CREATE TABLE IF NOT EXISTS mds_prescriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patient_id INT NOT NULL,
        doctor_id INT NOT NULL,
        date DATE NOT NULL,
        medications TEXT NOT NULL,
        instructions TEXT,
        valid_until DATE,
        status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES mds_patients(id) ON DELETE CASCADE,
        FOREIGN KEY (doctor_id) REFERENCES mds_users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;`,

      `CREATE TABLE IF NOT EXISTS mds_lab_work (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patient_id INT NOT NULL,
        doctor_id INT NOT NULL,
        lab_name VARCHAR(200) NOT NULL,
        work_type VARCHAR(100) NOT NULL,
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
      ) ENGINE=InnoDB;`,

      `CREATE TABLE IF NOT EXISTS mds_treatment_plans (
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
      ) ENGINE=InnoDB;`,

      `CREATE TABLE IF NOT EXISTS mds_treatment_plan_items (
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
      ) ENGINE=InnoDB;`,

      `CREATE TABLE IF NOT EXISTS mds_settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;`,

      `INSERT IGNORE INTO mds_settings (setting_key, setting_value) VALUES 
       ('invoice_template', '["header", "clinic_info", "patient_info", "treatment_table", "totals", "footer"]');`,

      `CREATE TABLE IF NOT EXISTS mds_sterilization (
        id INT AUTO_INCREMENT PRIMARY KEY,
        doctor_id INT NOT NULL,
        cycle_number VARCHAR(50) NOT NULL,
        equipment_id VARCHAR(50),
        temperature DECIMAL(5,2),
        pressure DECIMAL(5,2),
        duration_minutes INT,
        status ENUM('passed', 'failed', 'process') DEFAULT 'passed',
        notes TEXT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (doctor_id) REFERENCES mds_users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;`,

      `CREATE TABLE IF NOT EXISTS mds_suppliers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        contact_person VARCHAR(100),
        phone VARCHAR(50),
        email VARCHAR(100),
        address TEXT,
        website VARCHAR(255),
        category VARCHAR(100),
        notes TEXT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;`
    ];

    for (let i = 0; i < queries.length; i++) {
        console.log(`Executing query ${i+1}...`);
        await db.query(queries[i]);
    }

    console.log('Migration successful!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
