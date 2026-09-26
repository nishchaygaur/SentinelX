# SentinelX — Docker & Docker Compose Setup

## 1. Overview

SentinelX includes a multi-container Docker Compose configuration (`docker-compose.yml`) that launches the full stack:
- **db**: PostgreSQL 17 Alpine container.
- **backend**: Node.js 24 Bookworm Slim with native compiled YARA tools.
- **frontend**: Node.js 24 Alpine container running Vite development server.

---

## 2. Architecture of Containers

```
┌─────────────────────────────────────────────────────────────┐
│                   SENTINELX DOCKER NETWORK                  │
│                                                             │
│  ┌─────────────────┐   Port 5000    ┌────────────────────┐  │
│  │ backend         │<──────────────>│ frontend           │  │
│  │ (Node 24 + YARA)│                │ (Vite Dev Server)  │  │
│  └────────┬────────┘                └────────┬───────────┘  │
│           │ Port 5432                        │              │
│           ▼                                  ▼              │
│  ┌─────────────────┐                 (Host: 5173)           │
│  │ db (Postgres 17)│                                        │
│  └─────────────────┘                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Launching with Docker Compose

```bash
# 1. Build and start containers in the foreground
docker compose up --build

# 2. Or start in detached background mode
docker compose up -d --build
```

### Exposed Ports:
- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000/api`
- **PostgreSQL**: `localhost:5432`

---

## 4. Initializing the Database in Docker

Once containers are healthy, run migrations and seeder inside the backend container:

```bash
docker compose exec backend node ../database/migrate.js
docker compose exec backend node ../scripts/seed.js
```

---

## 5. Teardown & Volume Reset

```bash
# Stop containers
docker compose down

# Stop containers and destroy persistent database volume
docker compose down -v
```
