# ARTMS — Automated Recruitment and Talent Management System

A full-stack, high-performance web application built with **React (Vite)** for the frontend, **Laravel 11** for the backend REST API, **MySQL 8.0** database with composite indexing, and **Redis** for sub-millisecond read caching.

---

## Project Structure

```
ARTMS/
├── ARTMS-main/          # React Vite Frontend (port 5173)
└── artms-backend/       # Laravel REST API Backend (port 8000)
```

---

## Prerequisites

Install all of the following before running the project on any device.

| Software | Minimum Version | Verify Command | Download / Notes |
|---|---|---|---|
| PHP | 8.2+ | `php -v` | [windows.php.net](https://windows.php.net/download/) or via XAMPP |
| Composer | 2.x | `composer -V` | [getcomposer.org](https://getcomposer.org/Composer-Setup.exe) |
| Node.js | 18+ | `node -v` | [nodejs.org](https://nodejs.org) |
| npm | 9+ | `npm -v` | Included with Node.js |
| MySQL | 8.0+ | `mysql --version` | [dev.mysql.com](https://dev.mysql.com/downloads/installer/) |
| ngrok / localtunnel | latest | `ngrok --version` | [ngrok.com](https://ngrok.com) (for temporary public hosting) |
| Redis (Optional) | 6.0+ | `redis-cli ping` | Recommended for low-latency boot caching |
| Git | any | `git --version` | [git-scm.com](https://git-scm.com) |

---

## 💻 Setting Up the System on a New Device

Follow this initial setup checklist when opening the repository on a new computer or laptop:

### Step 1 — Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/ARTMS.git
cd ARTMS
```

### Step 2 — Backend Initialization (Laravel)
```bash
cd artms-backend

# 1. Install PHP dependencies
composer install

# 2. Create environment configuration
cp .env.example .env

# 3. Generate Laravel encryption key
php artisan key:generate
```

Open `artms-backend/.env` and configure your database credentials:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=artms_db
DB_USERNAME=root
DB_PASSWORD=your_mysql_password
```

Create the database in MySQL and run migrations with seeders & composite indexes:
```bash
# Create MySQL DB
mysql -u root -p -e "CREATE DATABASE artms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Run migrations, seed accounts, and build performance indexes
php artisan migrate --seed

# Pre-warm boot payload cache
php artisan artms:warm-cache --active-only
```

### Step 3 — Frontend Initialization (React)
Open a new terminal and navigate to the frontend:
```bash
cd ARTMS-main

# 1. Install JavaScript dependencies
npm install

# 2. Create environment configuration
cp .env.example .env
```

Ensure `ARTMS-main/.env` points to your backend API URL:
```env
VITE_API_URL=http://localhost:8000/api
```

---

## 🚀 How to Start the System (Daily Use & Temporary Hosting)

To launch the system, open **3 separate CLI terminal windows** on your device:

### Terminal 1 — Start Backend Server (Laravel API)
```bash
cd artms-backend
php artisan serve --host=0.0.0.0 --port=8000
```
> `--host=0.0.0.0` binds Laravel to all network interfaces so local devices and ngrok tunnels can reach it.

### Terminal 2 — Start Frontend Server (React Vite)
```bash
cd ARTMS-main
npm run dev -- --host
```
> `-- --host` exposes the Vite frontend to external network access and tunnel proxies.

### Terminal 3 — Start ngrok (Temporary Public Hosting & Device Testing)
To expose the React Vite frontend so mobile phones, tablets, or external devices can access the web application and test the video conferencing module:

```bash
ngrok http 5173
```

- **Backend Tunnel URL**: `https://strategic-shifty-gauntlet.ngrok-free.dev/`
- **Frontend Tunnel URL**: Copy the temporary HTTPS URL output by ngrok (e.g. `https://xxxx.ngrok-free.app`) and open it on your mobile device or external browser.

> **Note:** Make sure `php artisan serve --host=0.0.0.0 --port=8000` is running in Terminal 1 so ngrok API calls reach your backend server.

---

## ⚡ New Implementations & Performance Features

### 1. High-Performance Cache-Aside & Tagged Redis Layer
- **`BootCacheService`** ([App\Services\Cache\BootCacheService](file:///c:/Users/ASUS/OneDrive/Desktop/ARTMS/ARTMS/artms-backend/app/Services/Cache/BootCacheService.php)): Encapsulates read-heavy boot payloads (User profiles, roles, permissions, department structure) in sub-millisecond cache with tag-based invalidation.

### 2. Event-Driven Cache Invalidation
- **`UserObserver`** ([App\Observers\UserObserver](file:///c:/Users/ASUS/OneDrive/Desktop/ARTMS/ARTMS/artms-backend/app/Observers/UserObserver.php)): Automatically invalidates user cache entries instantly upon data updates or deletions.

### 3. Composite Multi-Column Database Indexing
- **Migration**: [2026_07_28_000001_add_performance_indexes.php](file:///c:/Users/ASUS/OneDrive/Desktop/ARTMS/ARTMS/artms-backend/database/migrations/2026_07_28_000001_add_performance_indexes.php)
- Adds high-efficiency ESR indexes (`users(department_id, is_active, role)`, `job_postings(status, is_active, created_at)`, `applicants(job_posting_id, status)`), eliminating full table scans in MySQL.

### 4. Cache Warming Automation
- **Artisan Command**: `php artisan artms:warm-cache` ([WarmCacheCommand.php](file:///c:/Users/ASUS/OneDrive/Desktop/ARTMS/ARTMS/artms-backend/app/Console/Commands/WarmCacheCommand.php))
- Asynchronously pre-populates Redis memory with active user payloads during system startup or deployment.

### 5. Consolidated Single-Flight Boot API
- **Endpoint**: `GET /api/boot` and `GET /api/public/boot` ([AppBootController.php](file:///c:/Users/ASUS/OneDrive/Desktop/ARTMS/ARTMS/artms-backend/app/Http/Controllers/AppBootController.php))
- Consolidates initial frontend data fetches into **1 single HTTP network roundtrip**.

---

## Default Login Accounts

These accounts are created automatically when running `php artisan migrate --seed`:

| Role | Email | Password |
|---|---|---|
| Super Admin | superadmin@artms.com | SuperAdmin@2024 |
| HR Admin | hradmin@artms.com | HrAdmin@2024 |
| COO | coo@artms.com | CooUser@2024 |
| Department Head | depthead@artms.com | DeptHead@2024 |

---

## Troubleshooting

### `php artisan` is not recognized
PHP is not in your system PATH. Add `C:\xampp\php` (or your PHP path) to Environment Variables -> PATH.

### ngrok prints USAGE help menu instead of starting
In ngrok v3, an **Auth Token** is required. If no authtoken is configured or if the config file is missing, ngrok defaults to displaying the help screen.
1. Get a free token from [dashboard.ngrok.com](https://dashboard.ngrok.com)
2. Run: `ngrok config add-authtoken YOUR_AUTHTOKEN_HERE`
3. Alternatively, use zero-config localtunnel: `npx localtunnel --port 5173`

### ngrok / Localtunnel connection issues
Ensure both Laravel (`--host=0.0.0.0`) and Vite (`--host`) are running before launching the tunnel.

### Cache errors / stale data
Clear the Laravel config and application cache:
```bash
cd artms-backend
php artisan config:clear
php artisan cache:clear
php artisan artms:warm-cache
```
