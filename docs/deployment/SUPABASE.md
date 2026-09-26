# SentinelX — Database Deployment on Supabase

## 1. Overview

SentinelX is designed for **Supabase PostgreSQL**.

---

## 2. Setup Guide

1. Create a new project in [Supabase](https://supabase.com/).
2. Retrieve the **Connection String** from **Project Settings** → **Database**:
   - Select **URI** mode (Port 5432 or 6543 pooler).
   - Format: `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`
3. Execute migrations from your workstation:
   ```bash
   DATABASE_URL="postgresql://..." node database/migrate.js
   ```
4. Seed initial telemetry (optional):
   ```bash
   DATABASE_URL="postgresql://..." node scripts/seed.js
   ```
