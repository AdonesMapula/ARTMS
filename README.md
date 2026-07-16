[README.md](https://github.com/user-attachments/files/30073394/README.md)
# ARTMS — Automated Recruitment and Talent Management System

A full-stack web application built with **React (Vite)** for the frontend and **Laravel 11** for the backend REST API, connected to a **MySQL** database.

---

## Project Structure

```
ARTMS/
├── ARTMS-main/          # React Vite Frontend (port 5173)
└── artms-backend/       # Laravel REST API Backend (port 8000)
```

---

## Prerequisites

Install all of the following before running the project. Use the commands to verify each one is ready.

| Software | Minimum Version | Verify Command | Download |
|---|---|---|---|
| PHP | 8.2+ | `php -v` | [windows.php.net](https://windows.php.net/download/) or via XAMPP |
| Composer | 2.x | `composer -V` | [getcomposer.org](https://getcomposer.org/Composer-Setup.exe) |
| Node.js | 18+ | `node -v` | [nodejs.org](https://nodejs.org) |
| npm | 9+ | `npm -v` | Included with Node.js |
| MySQL | 8.0+ | `mysql --version` | [dev.mysql.com](https://dev.mysql.com/downloads/installer/) |
| Git | any | `git --version` | [git-scm.com](https://git-scm.com) |

> **Recommended:** Install [XAMPP](https://www.apachefriends.org/download.html) to get PHP 8.2 and MySQL together in one installer.

---

## Setup Checklist

Work through each section in order. Do not skip steps.

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/ARTMS.git
cd ARTMS
```

---

### Step 2 — Backend Setup

```bash
cd artms-backend
```

#### 2a. Install PHP dependencies
```bash
composer install
```

#### 2b. Create your environment file
```bash
cp .env.example .env
```

Open `.env` in any text editor and fill in your values:

```env
DB_DATABASE=artms_db
DB_USERNAME=root
DB_PASSWORD=your_mysql_password_here

MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_gmail_app_password
```

Leave everything else as-is for local development.

#### 2c. Generate the application key
```bash
php artisan key:generate
```

You should see: `INFO Application key set successfully.`

#### 2d. Create the MySQL database

Open MySQL Workbench and run:
```sql
CREATE DATABASE artms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Or run it from the terminal:
```bash
mysql -u root -p -e "CREATE DATABASE artms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

#### 2e. Run database migrations and seed default accounts
```bash
php artisan migrate --seed
```

This creates all database tables and inserts the default login accounts shown below.

#### 2f. Start the backend server
```bash
php artisan serve --port=8000
```

**Confirm it works** — open this URL in your browser:
```
http://localhost:8000/api/public/job-postings
```
You should see a JSON response. If you do, the backend is running correctly.

---

### Step 3 — Frontend Setup

Open a **new terminal window**, then:

```bash
cd ARTMS-main
```

#### 3a. Install JavaScript dependencies
```bash
npm install
```

#### 3b. Create your environment file
```bash
cp .env.example .env
```

The default value is already correct for local development:
```env
VITE_API_URL=http://localhost:8000/api
```

#### 3c. Start the frontend development server
```bash
npm run dev
```

Open your browser and go to:
```
http://localhost:5173
```

---

### Step 4 — Verify the App is Working

Go through this checklist in your browser:

- [ ] `http://localhost:5173` — Public home page loads
- [ ] `http://localhost:5173/login` — Login form appears
- [ ] Log in as Super Admin → dashboard loads with live data
- [ ] Log in as HR Admin → redirected to HR dashboard
- [ ] Log in as Department Head → redirected to department dashboard
- [ ] Log out works correctly

---

## Default Login Accounts

These are created automatically when you run `php artisan migrate --seed`.

| Role | Email | Password |
|---|---|---|
| Super Admin | superadmin@artms.com | SuperAdmin@2024 |
| HR Admin | hradmin@artms.com | HrAdmin@2024 |
| COO | coo@artms.com | CooUser@2024 |

> **Change these passwords immediately after first login in any non-development environment.**

---

## Running the App (Daily Use)

Every time you want to run the app, you need **two terminals open at the same time**:

**Terminal 1 — Backend**
```bash
cd artms-backend
php artisan serve --port=8000
```

**Terminal 2 — Frontend**
```bash
cd ARTMS-main
npm run dev
```

Both must be running simultaneously. Closing either one will break the app.

---

## Troubleshooting

### `php artisan` is not recognized
PHP is not in your system PATH. Either use the full path:
```bash
C:\xampp\php\php.exe artisan serve --port=8000
```
Or add `C:\xampp\php` to your Windows Environment Variables → PATH.

---

### `composer install` fails with a PHP version error
Your PHP version is below 8.2. Download and install XAMPP 8.2+ from [apachefriends.org](https://www.apachefriends.org/download.html).

---

### `SQLSTATE[HY000] [1045] Access denied`
The database password in your `.env` is wrong. Open `artms-backend/.env` and correct `DB_PASSWORD`.

---

### `SQLSTATE[HY000] [1049] Unknown database 'artms_db'`
You skipped Step 2d. Create the database in MySQL first, then re-run `php artisan migrate --seed`.

---

### Login returns a CORS error in the browser
The backend server is not running. Open a terminal, go to `artms-backend`, and run `php artisan serve --port=8000`.

---

### Login returns HTTP 419 (CSRF token mismatch)
Open `artms-backend/bootstrap/app.php` and confirm the `statefulApi()` line is commented out:
```php
// $middleware->statefulApi();
```
Then restart the backend server.

---

### Frontend shows a blank page or module errors
```bash
cd ARTMS-main
rm -rf node_modules
npm install
npm run dev
```

---

### Changes to `.env` are not taking effect
Clear the Laravel config cache:
```bash
cd artms-backend
php artisan config:clear
php artisan cache:clear
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, Tailwind CSS v4 |
| Routing | React Router v7 |
| HTTP Client | Axios |
| Backend | Laravel 11 |
| Authentication | Laravel Sanctum (Bearer token) |
| Database | MySQL 8.0 |
| ORM | Laravel Eloquent |

---

## Environment Files

Neither `.env` file is included in the repository for security reasons. Both `.env.example` files are included as templates.

| File | Purpose |
|---|---|
| `artms-backend/.env.example` | Backend environment template |
| `ARTMS-main/.env.example` | Frontend environment template |

Copy each one to `.env` and fill in your credentials before running.
