# Aiven MySQL Production Database Migration Guide (ARTMS)

This document provides step-by-step instructions for migrating the **ARTMS** database layer from a local MySQL instance to **Aiven MySQL** in production, while keeping local development intact.

---

## 1. Aiven MySQL Setup

Follow these exact steps to create and configure the target database service.

### Step 1: Create an Aiven Account
1. Open the [Aiven Console](https://console.aiven.io/).
2. Sign up using your Google account or email.

### Step 2: Create a MySQL Service
1. In the Aiven console, click **Create service**.
2. Select **MySQL** as the database service.
3. Configure the deployment details:
   - **Cloud provider**: Choose a cloud provider (e.g. AWS, GCP, or DigitalOcean) and the region closest to your application hosting environment.
   - **Service plan**: Select the **Free** plan or a low-cost hobbyist/development plan.
   - **Service name**: Enter `artms-mysql-prod`.
4. Click **Create service** and wait for the status to show **Running** (usually takes a few minutes).

### Step 3: Obtain Connection Credentials
On the service **Overview** page under **Connection information**, copy the following values:
- **Host**: (e.g., `artms-mysql-prod-project-name.aivencloud.com`)
- **Port**: (e.g., `12345`)
- **User**: `avnadmin`
- **Password**: The generated password (click the eye icon to reveal it).
- **Database**: `defaultdb`

### Step 4: Download the CA Certificate
1. On the service **Overview** page, locate **CA Certificate**.
2. Click **Download** to save `ca.pem` to your local machine.
3. Place `ca.pem` in a secure directory on your application server that is NOT accessible publicly and is excluded from Git. For example:
   ```text
   artms-backend/storage/certs/ca.pem
   ```

---

## 2. Environment Configuration (`.env`)

Add the Aiven MySQL details to your Laravel production `.env` configuration file:

```env
DB_CONNECTION=mysql
DB_HOST=artms-mysql-prod-project-name.aivencloud.com
DB_PORT=12345
DB_DATABASE=defaultdb
DB_USERNAME=avnadmin
DB_PASSWORD=your_production_secure_password
DB_SOCKET=

# Aiven SSL/TLS Configuration
MYSQL_ATTR_SSL_CA=/absolute/path/to/artms-backend/storage/certs/ca.pem
MYSQL_ATTR_SSL_VERIFY_SERVER_CERT=true
```

Ensure that you clear the configuration cache after making `.env` edits:
```bash
php artisan config:clear
```

---

## 3. Data Migration Procedure (mysqldump)

To safely migrate schema and development records from local MySQL to Aiven:

### Step 1: Backup Local Database
Export your local database schema and data to an SQL dump file:
```bash
mysqldump -u root -p --default-character-set=utf8mb4 --single-transaction --routines --triggers artms_db > artms_backup.sql
```

### Step 2: Validate Target Compatibility
Verify that the target database uses `utf8mb4` with collation `utf8mb4_unicode_ci`.

### Step 3: Restore to Aiven MySQL
Import the backup file into Aiven MySQL over TLS:
```bash
mysql -u avnadmin -p -h artms-mysql-prod-project-name.aivencloud.com -P 12345 --ssl-mode=REQUIRED defaultdb < artms_backup.sql
```

---

## 4. Verification Checklist

After deploying the changes, run the following verification checks:

1. **Clear Config Cache**:
   ```bash
   php artisan config:clear
   ```
2. **Execute Diagnostic Health Command**:
   Run the custom diagnostic tool:
   ```bash
   php artisan artms:db-health
   ```
   *Expected Output:*
   ```text
   ARTMS Database Health Check
   ---------------------------
   Driver: mysql
   Connection: OK
   Database: defaultdb
   MySQL Version: 8.0.x
   Migrations: Up to date
   Tables: OK
   Indexes: OK
   ```
3. **Run Migrations (if database was empty)**:
   ```bash
   php artisan migrate --force
   ```
4. **Warm Application Cache**:
   ```bash
   php artisan cache:clear
   ```
   ```bash
   php artisan artms:warm-cache --active-only
   ```
5. **Verify Essential Endpoints**:
   - `GET /api/boot` (returns status 200)
   - `GET /api/public/boot` (returns status 200)

---

## 5. Rollback Plan

If connectivity issues are encountered on Aiven:

1. Restore local database settings in the production environment's `.env`:
   ```env
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=artms_db
   DB_USERNAME=root
   DB_PASSWORD=local_secure_password
   MYSQL_ATTR_SSL_CA=
   ```
2. Clear the configuration cache:
   ```bash
   php artisan config:clear
   ```
3. Verify connection locally:
   ```bash
   php artisan artms:db-health
   ```
4. Warm cache back up to restore operation:
   ```bash
   php artisan artms:warm-cache --active-only
   ```
