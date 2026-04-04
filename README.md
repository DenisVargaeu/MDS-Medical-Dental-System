# MDS - Medical Dental System v2.0.0 "Visionary Release"
> **High-Integrity Clinical Suite for Precision Healthcare**

Medical Dental System (MDS) is a premium, high-integrity electronic health record (EHR) and clinical management system built for state-of-the-art dental practices. MDS is a professional, high-performance Desktop application (Electron) with a robust Node.js backend. Specifically engineered for clinical excellence, version 2.0.0 "Visionary Release" streamlines the application by removing administrative overhead and focusing on deep clinical data integrity.

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Version](https://img.shields.io/badge/Version-2.0.0--Visionary--Release-blueviolet.svg)
![Status](https://img.shields.io/badge/Status-Production--Ready-success.svg)

---

## 🚀 Key Clinical Modules

### 🏥 Advanced Practice Management
- **Intelligent Dashboard**: Real-time clinic stats, today's schedule, and revenue trends.
- **Unified Patient Directory**: Comprehensive EMR (Electronic Medical Records) with full clinical history.
- **Smart Scheduling**: Conflict-aware appointment engine with status tracking.

### 🧬 Specialist Clinical Tools
- **Patient Vitals Tracker (New)**: High-resolution tracking for Blood Pressure, Pulse, BMI, and Oxygen Saturation (SpO2) with historical analytics.
- **Phased Treatment Planning**: Multi-stage dental plans with automated cost calculations and visual completion progress tracking.
- **Odontogram (Dental Chart)**: Visual charting with history of tooth-specific procedures.

### 📈 Business & Compliance Operations
- **Finance & Automated Invoicing**: One-click professional PDF-grade invoices with custom clinic branding.
- **Inventory & Supply Chain**: Stock tracking with minimal-level alerts.
- **Integrated Audit Logs**: Transparent tracking of all clinical and administrative changes.

---

## 🎨 Premium UI/UX (Glassmorphism 2.0)
The application features a cutting-edge **Glassmorphism 2.0** design system:
- **High Performance**: Optimized blur effects and hardware acceleration for smooth interaction on medical workstations.
- **Vibrant Aesthetics**: Sophisticated HSL color tokens for high-integrity medical visuals.
- **Micro-Animations**: Smooth, hardware-accelerated transitions and entry animations.

---

## 🛠️ Technical Stack
- **Frontend**: Electron, Vanilla JavaScript, CSS3 (Custom Design System).
- **Backend**: Node.js, Express, MySQL (Relational Persistence).
- **Communication**: REST API with JWT-based Auth and Role-Based Access Control (RBAC).

---

## 📦 Installation & Setup

### 1. Database Configuration
1. Install MySQL 8.0+.
2. Create a database: `CREATE DATABASE mds_db;`.
3. Import the schema: `mysql -u root -p mds_db < backend/schema.sql`.

### 2. Backend Setup
```bash
cd backend
npm install
npm start
```

### 3. Desktop Application Setup
```bash
cd frontend
npm install
npm start
```

---

## 💎 Project Evolution
MDS version 1.7.0 "Core Precision" represents a strategic refactoring of the platform. By stripping away non-essential administrative modules (Laboratory Work, Recall Manager, Sterilization Logs), we have delivered a significantly faster and more stable clinical core.

Developed with ❤️ for the medical community.
