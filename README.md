# MDS - Medical Dental System (v1.1.0-beta)

![MDS Logo](frontend/renderer/assets/icons/icon.png)

A professional-grade, high-performance Clinic Management System built with Electron, Node.js, and MySQL. Designed for modern dental practices to streamline scheduling, patient records, and clinical workflows with a premium glassmorphic aesthetic.

---

## 🚀 Key Features

*   **📅 Advanced Scheduling**: Drag-and-drop style appointment management with automated procedure duration and role-based views.
*   **🦷 Interactive Odontogram**: Real-time dental charting with state preservation, visual indicators, and history tracking.
*   **🩺 Clinical Workbench**: Specialized "Doctor's Workbench" for live treatment logging, medical records, and procedure pickers.
*   **📁 Unified Patient Records**: 360-degree view of medical history, allergies, medications, and diagnoses.
*   **🔗 Secure Device Pairing**: Connect tablets or remote devices securely using a 7-day pairing code and auto-detected IP/Hostname.
*   **💰 Automated Billing**: Intelligent invoice generation triggered automatically upon clinical session completion.
*   **🔒 Enterprise Security**: Role-based access control (Admin, Doctor, Receptionist) with secure JWT-based authentication.
*   **🛡️ Audit & logs**: Comprehensive tracking of all clinical and administrative actions for regulatory compliance.

## 🛠️ Technology Stack

- **Desktop Framework**: Electron (Cross-platform)
- **Backend API**: Node.js & Express.js
- **Database**: MySQL (Clinical-ready schema)
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3 (Custom Glassmorphism)
- **Icons**: Font Awesome 6 Pro styling
- **Packaging**: Electron-builder ready

## 📦 Quick Start

### 1. Prerequisites
- Node.js (v18.0 or later)
- MySQL Server (running and accessible)

### 2. Initial Setup
Run the setup utility to initialize dependencies and configure the environment:
```bash
./setup.sh  # (If available) or follow manual steps below
```

#### Manual Database Initialization
Create a database (default: `db215343xdenis`) and run the schema:
```bash
mysql -u [user] -p [dbname] < backend/schema.sql
```

#### Environment Configuration
Configure `backend/.env`:
```env
DB_HOST=sql20.dnsserver.eu
DB_USER=your_user
DB_PASS=your_password
DB_NAME=your_db
JWT_SECRET=your_secret_key
PORT=3000
```

### 3. Installation
Install dependencies for both components:
```bash
# From root directory
cd backend && npm install
cd ../frontend && npm install
```

### 4. Running the Application
The simplest way to start both the API and the Desktop App is using the unified startup script:
```bash
# From root directory
./start.sh
```
*Note: Make sure the script is executable (`chmod +x start.sh`).*

## 📱 Device Pairing
For security, every client device must pair with the server:
1.  **Start the Backend**: The console will display your **IP**, **Hostname**, and a **6-digit Pairing Code**.
2.  **Enter Pairing Info**: On first launch, the App will prompt for the Server Address and Pairing Code.
3.  **Expiry**: Pairing codes are valid for **7 days** for enhanced security.

## 📁 Project Structure
```text
MDS/
├── backend/            # Express.js REST API
│   ├── src/
│   │   ├── config/     # Database & App config
│   │   ├── routes/     # API Endpoints
│   │   └── utils/      # Helpers (Pairing, Auth)
│   └── schema.sql      # Database initialization
├── frontend/           # Electron Application
│   ├── main.js         # Electron Main process
│   ├── preload.js      # IPC Bridge
│   └── renderer/       # UI Logic & Assets
└── start.sh            # Unified startup script
```

## 📄 License
Commercial - All rights reserved.

---
*Developed for NEXT-GEN Dental Clinic Management.*
