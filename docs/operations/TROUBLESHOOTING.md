# SentinelX — Troubleshooting & Diagnostics Guide

## 1. Common Issues & Solutions

### 1. Backend Fails to Start: "Connection Refused on Port 5432"
- **Cause**: PostgreSQL service is stopped or credentials incorrect.
- **Solution**:
  - Verify PostgreSQL service status: `net start postgresql-x64-17` (Windows) or `sudo systemctl status postgresql` (Linux).
  - Verify `DB_PASSWORD` in `backend/.env`.

### 2. Frontend Shows "Connection Warning: /dashboard/summary returned 500"
- **Cause**: Database tables have not been initialized.
- **Solution**: Run `node database/migrate.js` followed by `node scripts/seed.js`.

### 3. Log Shipper Returns HTTP 401 Unauthorized
- **Cause**: `LOG_INGESTION_TOKEN` is set on backend but missing or incorrect in shipper.
- **Solution**: Pass `--token "<token>"` to the shipper script.

### 4. OpenRouter AI Returns Error
- **Cause**: Invalid or expired API key, or insufficient credits.
- **Solution**: Verify `OPENROUTER_API_KEY` in `backend/.env` and model selection.
