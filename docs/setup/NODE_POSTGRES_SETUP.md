# SentinelX — Node.js & PostgreSQL Configuration

## 1. Node.js Engine Configuration

SentinelX requires **Node.js 20 or higher** (Node.js 24 LTS tested and verified).

Key backend packages (`backend/package.json`):
- `express@^5.2.1`: Web server with native async error handling.
- `pg@^8.23.0`: High-performance PostgreSQL client with connection pooling.
- `helmet@^8.3.0`: Security headers middleware.
- `cors@^2.8.6`: Dynamic origin whitelisting.
- `pdfkit@^0.20.2`: Multi-page vector PDF generation.
- `axios@^1.19.0`: HTTP client for OpenRouter AI communications.
- `dotenv@^17.4.2`: Environment variable injection.

---

## 2. PostgreSQL Connection Pooling (`backend/src/config/db.js`)

SentinelX supports two connection modes:
1. **URI Mode (`DATABASE_URL`)**: Used for managed cloud databases (Supabase, Render). Automatically configures SSL with `rejectUnauthorized: false` if cloud hostnames are detected.
2. **Parameter Mode**: Fallback to discrete parameters (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`).

### Pool Settings:
- `max: 20`: Up to 20 concurrent database connections.
- `idleTimeoutMillis: 30000`: Closes idle connections after 30 seconds.
- `connectionTimeoutMillis: 5000`: Fails fast if DB is unreachable.

---

## 3. Database Health Check

To test connection to PostgreSQL without starting the full Express server:

```bash
node -e "const pool = require('./backend/src/config/db'); pool.query('SELECT NOW()').then(r => { console.log('DB Connected:', r.rows[0]); process.exit(0); }).catch(e => { console.error('Connection failed:', e.message); process.exit(1); });"
```
