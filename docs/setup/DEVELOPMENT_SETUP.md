# SentinelX — Local Development Setup Guide

## 1. Overview

This guide walks you through setting up a complete local development environment for SentinelX on macOS, Linux, or Windows.

SentinelX consists of:
- **Backend API**: Node.js 24 + Express 5 running on port `5000`.
- **Database**: PostgreSQL 17 on port `5432` (or Supabase cloud PostgreSQL).
- **Frontend SPA**: React 19 + Vite 8 on port `5173`.

---

## 2. Prerequisites

Ensure you have the following installed:
- **Node.js**: v20+ (v24 LTS recommended). Verify: `node -v`
- **npm**: v10+. Verify: `npm -v`
- **PostgreSQL**: v15+ (v17 recommended). Verify: `psql --version`
- **Git**: Latest version. Verify: `git --version`
- **YARA** (Optional for malware scanning): v4.2+. Verify: `yara --version`

---

## 3. Clone and Install Dependencies

```bash
# 1. Clone repository
git clone https://github.com/nishchaygaur/SentinelX.git
cd SentinelX

# 2. Install backend dependencies
npm --prefix backend install

# 3. Install frontend dependencies
npm --prefix frontend install
```

---

## 4. Configure Environment Variables

Create `backend/.env` by copying `.env.example`:

```bash
cp .env.example backend/.env
```

Edit `backend/.env` with your local configuration:

```env
PORT=5000
NODE_ENV=development

# Option A: Local PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sentinelx
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# Option B: Cloud Database (e.g. Supabase)
# DATABASE_URL=postgresql://postgres.[ref]:[password]@[host]:6543/postgres

CORS_ORIGIN=http://localhost:5173
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=openrouter/free
LOG_INGESTION_TOKEN=optional_secret_token_123
```

---

## 5. Database Initialization & Seeding

Run the idempotent database migration runner to create tables and indexes:

```bash
node database/migrate.js
```

Populate the database with authentic attack scenarios (SSH brute force, port scans, SQLi, malware, anomalies):

```bash
node scripts/seed.js
```

---

## 6. Running the Applications

Open two terminal sessions:

```bash
# Terminal 1: Start Backend (Port 5000)
npm --prefix backend start
# Or for live auto-reload with nodemon:
npm --prefix backend run dev

# Terminal 2: Start Frontend (Port 5173)
npm --prefix frontend run dev
```

Visit **http://localhost:5173** to access the SentinelX SOC Console.
Visit **http://localhost:5173/docs** to browse the integrated Documentation Explorer.

---

## 7. Verify the Setup

Execute the test suites to ensure everything is operating cleanly:

```bash
# Run backend tests
npm --prefix backend test

# Run audit verification
node tests/verify_audit.js

# Run frontend linter
npm --prefix frontend run lint
```
