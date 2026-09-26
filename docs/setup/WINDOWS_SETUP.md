# SentinelX — Native Windows 11 Setup Guide

## 1. Prerequisites for Windows

SentinelX is fully developed and tested on **Windows 11 Enterprise (x64 / ARM64)**.

Required tools:
1. **Node.js 24 LTS**: Download and install the Windows installer from [nodejs.org](https://nodejs.org/). Ensure "Add to PATH" is checked.
2. **PostgreSQL 17 for Windows**: Download the EnterpriseDB installer from [postgresql.org](https://www.postgresql.org/download/windows/). Remember the superuser (`postgres`) password.
3. **Git for Windows**: Download from [git-scm.com](https://git-scm.com/).
4. **YARA for Windows** (Optional): Download precompiled `yara64.exe` from [VirusTotal/yara releases](https://github.com/VirusTotal/yara/releases) and add its directory to your System `PATH`.

---

## 2. PowerShell Execution Setup

Open **PowerShell as Administrator** and ensure scripts can be executed:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 3. Database Setup in PostgreSQL Windows

Open `psql` or **pgAdmin 4**:

```powershell
# Connect to local postgres
psql -U postgres

# Inside psql:
CREATE DATABASE sentinelx;
\q
```

---

## 4. Install Dependencies

In PowerShell from repository root (`D:\SentinelX`):

```powershell
# Install backend packages
npm --prefix backend install

# Install frontend packages
npm --prefix frontend install
```

---

## 5. Configure `backend/.env`

Copy `.env.example` to `backend/.env`:

```powershell
Copy-Item .env.example backend.env
```

Open `backend.env` in Notepad or VSCode and set:

```ini
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=sentinelx
DB_USER=postgres
DB_PASSWORD=YourPostgresPassword

CORS_ORIGIN=http://localhost:5173
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxx
OPENROUTER_MODEL=openrouter/free
```

---

## 6. Run Migrations & Seed

```powershell
# Run migrations
node database/migrate.js

# Populate initial telemetry
node scripts/seed.js
```

---

## 7. Starting the Development Servers

```powershell
# Window 1: Backend
npm --prefix backend start

# Window 2: Frontend
npm --prefix frontend run dev
```

Open your browser at **http://localhost:5173**.
