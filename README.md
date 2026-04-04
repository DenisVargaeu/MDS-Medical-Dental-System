# MDS — Medical Dental System [v1.1.0-beta]

MDS is a professional-grade, high-performance management platform for modern dental clinics. Built with a focus on UI/UX excellence, clinic efficiency, and clinical accuracy.

![MDS Dashboard Placeholder](https://via.placeholder.com/1200x600/0A1628/ffffff?text=MDS+v1.1.0+-+Modern+Dental+System)

## 🚀 Key Features

- **Advanced Appointment Calendar**: Professional weekly CSS Grid calendar with 8:00–20:00 time-slot management and status tracking.
- **Bento-style Dashboard**: High-end data visualization, revenue sparklines, and personalized clinician greetings.
- **Odontogram (Dental Chart)**: Interactive dental chart with visual status indicators, clinical notes, and pulse animations for critical conditions.
- **Financial Analytics**: Real-time revenue mix tracking and patient demographic reports with SVG data visualization.
- **Patient Management**: Comprehensive medical profiles, priority alerts, and treatment history tracking.
- **Secure Architecture**: JWT-based authentication and secure role-based access control.

## 🛠️ Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+), CSS3 (Bento Design/Grid), HTML5.
- **Backend**: Node.js, Express, MySQL.
- **Desktop**: Electron (Native Experience).

## 📦 Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/DenisVargaeu/MDS-Medical-Dental-System.git
   ```
2. **Setup Backend**:
   - Navigate to `/backend`
   - Run `npm install`
   - Configure `.env` (Database credentials)
   - Run `npm run dev`
3. **Setup Frontend**:
   - Navigate to `/frontend`
   - Run `npm install` (if applicable for Electron/Dependencies)
   - Launch via Electron or development server.

## 📈 Recent Updates (v1.1.0-beta)
- **PIVOT**: Replaced experimental Prescription/Lab modules with a robust weekly appointment calendar.
- **UI REFINEMENT**: Implemented a "premium" bento-grid layout for the dashboard.
- **POLISH**: Added micro-animations and improved visual feedback for the dental chart.
- **ANALYTICS**: Added SVG-based reports for clinic performance.

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
