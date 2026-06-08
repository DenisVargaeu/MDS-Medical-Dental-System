# 🏥 MDS - Medical Dental System v2.0.0

> **High-Integrity Clinical Suite for Precision Healthcare**

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-2.0.0-blueviolet.svg)](package.json)
[![Status](https://img.shields.io/badge/Status-Production--Ready-success.svg)](#-status)
[![Node.js](https://img.shields.io/badge/Node.js-16%2B-green.svg)](https://nodejs.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-yellow.svg)](#-tech-stack)
[![MySQL](https://img.shields.io/badge/MySQL-8.0%2B-blue.svg)](https://www.mysql.com/)
[![Electron](https://img.shields.io/badge/Electron-Desktop%20App-9feaf9.svg)](https://www.electronjs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-Backend-black.svg)](https://expressjs.com/)

---

## 📋 Table of Contents

- [📖 About](#-about)
- [🚀 Key Features](#-key-features)
- [🎨 Design System](#-design-system)
- [🛠️ Tech Stack](#️-tech-stack)
- [📦 Installation](#-installation)
- [🔧 Configuration](#-configuration)
- [📚 Documentation](#-documentation)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## 📖 About

**Medical Dental System (MDS)** is a premium, high-integrity electronic health record (EHR) and clinical management system built for state-of-the-art dental practices. MDS combines enterprise-grade reliability with intuitive clinical workflows, enabling practitioners to focus on patient care rather than administrative overhead.

**Current Version**: 2.0.0 "Visionary Release"  
**Status**: Production Ready ✅  
**Last Updated**: April 2026

---

## 🚀 Key Features

### 🏥 Advanced Practice Management
- **Intelligent Dashboard**: Real-time clinic statistics, daily schedule overview, and revenue analytics
- **Unified Patient Directory**: Comprehensive EMR with complete clinical history and patient profiles
- **Smart Scheduling**: Conflict-aware appointment engine with automated status tracking
- **Patient Management**: Advanced search, filtering, and record organization

### 🧬 Clinical Tools
- **Patient Vitals Tracker** ⭐ NEW
  - High-resolution tracking for Blood Pressure, Pulse, BMI, and Oxygen Saturation (SpO2)
  - Historical analytics and trend visualization
  - Exportable reports
- **Phased Treatment Planning**: Multi-stage dental plans with cost calculations and visual progress tracking
- **Odontogram (Dental Chart)**: Visual tooth charting with comprehensive procedure history
- **Clinical Documentation**: Structured notes and treatment records

### 📈 Business & Compliance
- **Finance & Invoicing**: One-click professional PDF invoices with custom clinic branding
- **Inventory Management**: Stock tracking with low-level alerts and supply chain optimization
- **Audit Logs**: Complete transparency with tracking of all clinical and administrative changes
- **Role-Based Access**: Secure RBAC implementation for clinic staff management

---

## 🎨 Design System

### Glassmorphism 2.0
The application features a cutting-edge **Glassmorphism 2.0** design system:

- **Performance Optimized**: Hardware-accelerated blur effects for smooth interaction on medical workstations
- **Medical Aesthetics**: Sophisticated HSL color tokens ensuring high-contrast readability and compliance
- **Micro-Animations**: Smooth, responsive transitions and entry animations for professional UX
- **Accessibility First**: WCAG-compliant design supporting keyboard navigation and screen readers

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Electron + Vanilla JavaScript | Desktop application framework |
| **UI/UX** | CSS3 (Custom Design System) | Premium glassmorphism interface |
| **Backend** | Node.js + Express.js | REST API and business logic |
| **Database** | MySQL 8.0+ | Relational data persistence |
| **Authentication** | JWT Tokens | Secure session management |
| **Authorization** | RBAC (Role-Based Access Control) | Fine-grained permission system |

**Language Composition:**
- JavaScript: **88.1%**
- CSS: **9.6%**
- HTML: **2.1%**
- Shell: **0.2%**

---

## 📦 Installation

### Prerequisites
- **Node.js**: v16.0 or higher ([Download](https://nodejs.org/))
- **npm**: v7.0 or higher (included with Node.js)
- **MySQL**: v8.0 or higher ([Download](https://www.mysql.com/downloads/))
- **Git**: For cloning the repository

### Quick Start

#### 1️⃣ Database Setup
```bash
# Install MySQL (if not already installed)
# macOS with Homebrew:
brew install mysql

# Start MySQL service
brew services start mysql

# Create database and user
mysql -u root -p << EOF
CREATE DATABASE mds_db;
CREATE USER 'mds_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON mds_db.* TO 'mds_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
EOF

# Import database schema
mysql -u mds_user -p mds_db < backend/schema.sql
```

#### 2️⃣ Backend Setup
```bash
cd backend
npm install
npm start
```
The backend will start on `http://localhost:5000`

#### 3️⃣ Frontend Setup
```bash
cd frontend
npm install
npm start
```
The Electron application will launch automatically

### Manual Configuration
Create `.env` files in both `backend` and `frontend` directories:

**backend/.env**
```env
NODE_ENV=production
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=mds_user
DB_PASSWORD=your_secure_password
DB_NAME=mds_db
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
```

**frontend/.env**
```env
API_BASE_URL=http://localhost:5000
API_TIMEOUT=30000
```

---

## 🔧 Configuration

### Database Configuration
1. Ensure MySQL 8.0+ is installed and running
2. Create database: `CREATE DATABASE mds_db;`
3. Import schema: `mysql -u root -p mds_db < backend/schema.sql`
4. Update backend `.env` with database credentials

### Server Configuration
- API runs on port `5000` by default
- Configurable via `PORT` environment variable
- JWT authentication enabled on all protected routes

### Client Configuration
- Desktop app configured via Electron
- API endpoint customizable in frontend `.env`
- SSL/TLS support for secure communications

---

## 📚 Documentation

### Project Structure
```
MDS-Medical-Dental-System/
├── backend/                 # Node.js + Express API
│   ├── routes/             # API endpoints
│   ├── models/             # Database models
│   ├── middleware/         # Authentication & validation
│   └── schema.sql          # Database schema
├── frontend/               # Electron desktop app
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Application pages
│   │   ├── styles/         # CSS & design system
│   │   └── utils/          # Helper functions
│   └── public/             # Static assets
└── README.md              # This file
```

### API Documentation
See [API Documentation](./backend/API.md) for detailed endpoint specifications.

### Development Guide
See [Contributing Guidelines](./CONTRIBUTING.md) for development setup and coding standards.

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/AmazingFeature`
3. **Commit** changes: `git commit -m 'Add AmazingFeature'`
4. **Push** to branch: `git push origin feature/AmazingFeature`
5. **Open** a Pull Request

### Code Standards
- Follow ESLint configuration
- Write meaningful commit messages
- Test changes before submitting PR
- Update documentation as needed

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

---

## 📖 Version History

### v2.0.0 "Visionary Release" (Current)
- ⭐ New Patient Vitals Tracker module
- Enhanced treatment planning capabilities
- Improved invoice generation
- Advanced audit logging
- Glassmorphism 2.0 UI system

### v1.7.0 "Core Precision"
- Strategic refactoring of core modules
- Removed non-essential features (Laboratory Work, Recall Manager, Sterilization Logs)
- Performance optimizations
- Enhanced security measures

---

## 🆘 Support & Troubleshooting

### Common Issues

**Issue**: Database connection fails
- **Solution**: Verify MySQL is running and credentials in `.env` are correct

**Issue**: Frontend won't start
- **Solution**: Clear npm cache: `npm cache clean --force` and reinstall

**Issue**: Port already in use
- **Solution**: Change PORT in `.env` or kill existing process

### Getting Help
- 📧 Email: contact@mds-system.com
- 🐛 Report bugs: [GitHub Issues](../../issues)
- 💬 Discussions: [GitHub Discussions](../../discussions)

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software...
```

---

## 🙏 Acknowledgments

- Built with ❤️ for the medical and dental community
- Designed for enterprise healthcare environments
- Developed with accessibility and compliance in mind

---

<div align="center">

**Developed by Denis Vargaeu**

[GitHub](https://github.com/DenisVargaeu) | [Repository](https://github.com/DenisVargaeu/MDS-Medical-Dental-System)

⭐ If you find this project helpful, please consider giving it a star!

</div>
