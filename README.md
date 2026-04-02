# MDS - Medical Dental System (v1.0.0-beta.1)

A professional-grade Clinic Management System built with Electron, Node.js, and MySQL. Designed for modern dental practices to streamline scheduling, patient records, and clinical workflows.

## 🚀 Key Features

*   **📅 Advanced Scheduling**: Drag-and-drop style appointment management with automated procedure duration.
*   **🦷 Interactive Odontogram**: Real-time dental charting with state preservation.
*   **🩺 Clinical Workbench**: specialized "Doctor's Workbench" for live treatment logging during sessions.
*   **📁 Unified Patient Records**: 360-degree view of medical history, allergies, and diagnoses.
*   **💰 Automated Billing**: Intelligent invoice generation triggered upon session completion.
*   **🔒 Enterprise Security**: Role-based access control (Admin, Doctor, Receptionist) and secure JWT authentication.
*   **🛡️ Audit & logs**: Comprehensive tracking of all clinical and administrative actions.

## 🛠️ Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3 (Glassmorphic Design).
- **Desktop**: Electron Framework.
- **Backend**: Node.js & Express REST API.
- **Database**: MySQL with specialized clinical schema.
- **Icons**: Font Awesome 6.

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16+)
- MySQL Server

### 1. Database Initialization
Create a database named `mds_dental` and run the schema:
```bash
mysql -u [user] -p [dbname] < backend/schema.sql
```

### 2. Backend Configuration
Create a `backend/.env` file:
```env
DB_HOST=localhost
DB_USER=root
DB_PASS=yourpassword
DB_NAME=mds_dental
JWT_SECRET=your_super_secret_key
UPLOAD_DIR=uploads
PORT=3000
```

### 3. Install Dependencies
```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 4. Run the Application
```bash
# Start backend (from backend folder)
npm start

# Start Electron (from frontend folder)
npm start
```

## 📄 License
Commercial - All rights reserved.

---
*Developed for Professional Dental Clinic Management.*
