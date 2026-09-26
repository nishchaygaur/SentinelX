# SentinelX — Local Deployment Options

## 1. Native Bare Metal (Windows / Linux / macOS)

Run directly on the host using native Node.js and PostgreSQL:

```bash
# 1. Apply schema and seed
node database/migrate.js
node scripts/seed.js

# 2. Run backend (Port 5000)
npm --prefix backend start

# 3. Run frontend (Port 5173)
npm --prefix frontend run dev
```

---

## 2. Containerized Deployment (Docker Compose)

Launch isolated containers for database, backend with YARA, and frontend:

```bash
docker compose up --build
```
