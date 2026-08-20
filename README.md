# ARTMS — AI-assisted Recruitment and Talent Management System

An enterprise-grade, full-stack recruitment and talent acquisition platform designed to streamline hiring workflows, candidate pipeline tracking, real-time video assessments, and role-based workforce management.

---

## 📌 Description & Purpose

### The Problem
Traditional recruitment processes suffer from fragmented toolsets, manual candidate tracking, scheduling friction, and subjective evaluations. These bottlenecks lead to prolonged hiring cycles, inconsistent candidate experiences, and administrative overhead across departments.

### The Solution
**ARTMS** centralizes the end-to-end recruitment lifecycle into a single high-performance web application. It integrates automated application tracking, synchronized departmental hiring requisitions, live WebRTC video interviewing, and AI-assisted candidate evaluation into a unified workflow.

### Core Features
- **Applicant Tracking System (ATS)**: Multi-stage candidate pipelines, automated status progression, resume parsing, and application screening.
- **WebRTC Video Conferencing**: Low-latency, browser-based video interviews powered by **LiveKit Cloud**.
- **AI-Assisted Evaluations**: Live transcript analysis, automated scoring, and structured candidate assessment reports via **xAI Grok**.
- **Role-Based Access Control (RBAC)**: Fine-grained permissions across Super Admin, HR Admin, COO, and Department Heads.
- **Manpower Requisitions**: Multi-tier approval workflows for departmental staffing requests and job vacancy authorizations.
- **High-Performance Architecture**: Composite-indexed MySQL database, sub-millisecond Redis cache-aside layer, and consolidated single-flight boot APIs.

---

## 📁 File Structure

```
ARTMS/
├── ARTMS-main/                  # Frontend Web Application (React 19, Vite, Tailwind CSS)
│   ├── public/                  # Static assets and favicon resources
│   ├── src/                     # React application source code
│   │   ├── assets/              # Images, icons, and static media
│   │   ├── components/          # Reusable UI components (tables, inputs, cards)
│   │   ├── context/             # Global state and authentication providers
│   │   ├── hooks/               # Custom React lifecycle and data hooks
│   │   ├── layouts/             # Dashboard, portal, and authentication layouts
│   │   ├── modals/              # Interactive dialogs and form overlays
│   │   ├── pages/               # Route-level views (Pipeline, Jobs, Interviews)
│   │   ├── routes/              # Client-side routing and protected route guards
│   │   ├── services/            # Axios API service integrations
│   │   └── utils/               # Formatting, constants, and helper utilities
│   ├── package.json             # Frontend dependencies and npm scripts
│   └── vite.config.js           # Vite development and bundle configuration
│
├── artms-backend/               # Backend REST API (Laravel 11, PHP 8.2+)
│   ├── app/                     # Core application logic
│   │   ├── Console/Commands/    # Artisan commands (e.g., cache warming)
│   │   ├── Http/Controllers/    # API controllers handling business workflows
│   │   ├── Models/              # Eloquent ORM models and relationships
│   │   ├── Observers/           # Model observers for cache invalidation
│   │   └── Services/            # Service layer (LiveKit, AI evaluation, caching)
│   ├── config/                  # Application, database, and service configurations
│   ├── database/                # Migrations, seeders, and composite indexes
│   ├── routes/                  # API endpoints (`routes/api.php`)
│   ├── storage/                 # Application storage, logs, and generated assets
│   ├── composer.json            # PHP dependencies and PSR-4 autoload rules
│   └── .env.example             # Backend environment template
│
├── docs/                        # Architecture guides and database documentation
└── README.md                    # Root project documentation and setup guide
```

---

## 🛠️ Setup & Installation

### Prerequisites

Ensure the following dependencies are installed and available in your system path:

| Dependency | Minimum Version | Verification Command |
|---|---|---|
| **PHP** | 8.2+ | `php -v` |
| **Composer** | 2.x | `composer -V` |
| **Node.js** | 18+ (LTS) | `node -v` |
| **npm** | 9+ | `npm -v` |
| **MySQL** | 8.0+ | `mysql --version` |
| **Redis** *(Optional)* | 6.0+ | `redis-cli ping` |

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/AdonesMapula/ARTMS.git
cd ARTMS
```

---

### Step 2: Backend Setup (Laravel 11)

1. Navigate to the backend directory:
   ```bash
   cd artms-backend
   ```

2. Install PHP dependencies:
   ```bash
   composer install
   ```

3. Create the environment configuration file:
   ```bash
   cp .env.example .env
   ```

4. Generate the application encryption key:
   ```bash
   php artisan key:generate
   ```

5. Configure database and service credentials in `.env`:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=artms_db
   DB_USERNAME=root
   DB_PASSWORD=your_mysql_password

   # LiveKit WebRTC Configuration
   LIVEKIT_URL=wss://your-livekit-host.livekit.cloud
   LIVEKIT_API_KEY=your_livekit_api_key
   LIVEKIT_API_SECRET=your_livekit_api_secret

   # AI Evaluation Service
   XAI_API_KEY=your_xai_grok_api_key
   ```

6. Create the MySQL database and run migrations with seed data:
   ```bash
   mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS artms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   php artisan migrate --seed
   ```

7. *(Optional)* Warm the Redis application boot cache:
   ```bash
   php artisan artms:warm-cache --active-only
   ```

---

### Step 3: Frontend Setup (React + Vite)

1. Navigate to the frontend directory in a separate terminal:
   ```bash
   cd ARTMS-main
   ```

2. Install JavaScript dependencies:
   ```bash
   npm install
   ```

3. Create the environment configuration file:
   ```bash
   cp .env.example .env
   ```

4. Verify API target URL in `ARTMS-main/.env`:
   ```env
   VITE_API_URL=http://localhost:8000/api
   ```

---

### Step 4: Running the Application Locally

Start the development servers across two terminal windows:

#### Terminal 1 — Backend API Server
```bash
cd artms-backend
php artisan serve --port=8000
```
> API available at: `http://localhost:8000/api`

#### Terminal 2 — Frontend Dev Server
```bash
cd ARTMS-main
npm run dev
```
> Application available at: `http://localhost:5173`

#### Building for Production
```bash
cd ARTMS-main
npm run build
```

---

## 👥 Default Test Accounts

Running `php artisan migrate --seed` provisions the following predefined roles for local testing:

| Role | Email | Default Password | Access Level |
|---|---|---|---|
| **Super Admin** | `superadmin@artms.com` | `SuperAdmin@2024` | Full system control & configuration |
| **HR Admin** | `hradmin@artms.com` | `HrAdmin@2024` | Recruitment pipelines, job postings & candidates |
| **COO** | `coo@artms.com` | `CooUser@2024` | High-level executive approvals & reporting |
| **Department Head** | `depthead@artms.com` | `DeptHead@2024` | Manpower requests & technical evaluations |

---

## 📬 Contact Information

For questions, support, or collaboration inquiries:

- **Lead Maintainer**: [Adones Mapula](https://github.com/AdonesMapula) — `adonesmapula.dev@gmail.com`
- **Collaborators**:
  - [Greg Gotot](https://github.com/gregbaringgotot) (`@gregbaringgotot`)
  - [Cristian Jeff Ludivese](https://github.com/LudiveseCristian) (`@LudiveseCristian`)
  - [Rye Nicholas Lao Guico](https://github.com/Qro0w) (`@Qro0w`)
- **Repository Issues**: [ARTMS Issues](https://github.com/AdonesMapula/ARTMS/issues)

---

## 📄 License

**Proprietary License**

Copyright © 2024–2026 ARTMS. All rights reserved.

This software and associated documentation files are proprietary and confidential. Unauthorized copying, distribution, modification, public display, reverse engineering, or transfer of this software, via any medium, is strictly prohibited without explicit prior written authorization from the copyright holder.
