# SentinelX — AI-Powered SOC & Threat Intelligence Platform

[![SentinelX Tests](https://img.shields.io/badge/SentinelX%20Tests-100%25%20Passing-brightgreen.svg)]()
[![Backend](https://img.shields.io/badge/Backend-Node.js%2024%20%7C%20Express%205-blue.svg)]()
[![Database](https://img.shields.io/badge/Database-PostgreSQL%2017%20%2F%20Supabase-336791.svg)]()
[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%7C%20Vite%208-61dafb.svg)]()
[![YARA](https://img.shields.io/badge/YARA-4.5.5-red.svg)]()
[![Linter](https://img.shields.io/badge/Oxlint-0%20warnings%200%20errors-success.svg)]()

> **SentinelX** is an enterprise-grade Security Operations Center (SOC) and Threat Intelligence Platform engineered to ingest, normalize, detect, correlate, investigate, and simulate incident response across multi-source security telemetry in real time.

---

## 1. System Architecture & Telemetry Pipeline

SentinelX operates as a unified, data-driven security operations pipeline:

```
+-----------------------------------------------------------------------------------+
|                            MULTI-SOURCE LOG INGESTION                             |
|  Ubuntu VM (SSH/Auth) | Windows Event Logs | Web Server | Firewall | Application  |
+-----------------------------------------------------------------------------------+
                                         │  (HTTPS / REST API)
                                         ▼
+-----------------------------------------------------------------------------------+
|                      VALIDATION & INGESTION CONTROLLER                            |
|  - IP/Port/Timestamp/Severity validation & input sanitization                     |
|  - Ingestion Token Authentication (`x-ingestion-token`)                           |
|  - Raw Log persistence into PostgreSQL `raw_logs`                                 |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                        MODULAR NORMALIZATION ENGINE                               |
|  - Windows Security IDs: 4625 (Failed), 4624 (Success), 4688 (Process Creation)   |
|  - Linux SSH: Failed password, Accepted publickey, Invalid user                   |
|  - Web Server: Common Log Format (CLF), Combined, SQL Injection probes            |
|  - Firewall: iptables / UFW packet drop & reject inspection                       |
|  - Application: Security exceptions, tracebacks, anomaly alerts                   |
|  - Structured persistence into PostgreSQL `normalized_logs`                       |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                      SENTINELX DETECTION RULES ENGINE                             |
|  1. Brute Force Detection        -> 5+ failed attempts / 5-min sliding window     |
|  2. Port Scan Detection          -> 5+ distinct destination ports / 5 min         |
|  3. SQL Injection Detection      -> RegEx signatures (UNION SELECT, OR '1'='1)    |
|  4. Suspicious Login Detection   -> Failures followed immediately by successful   |
|  5. Malware Indicators           -> Mimikatz, PowerShell -enc, C2 artifacts       |
|  6. Anomalous Activity           -> Baseline deviations & high-severity anomalies |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|               DYNAMIC RISK SCORING & THREAT ENRICHMENT ENGINE                     |
|  - Transparent Risk Formula: Severity + Confidence + Threat Intel + Technique     |
|  - Dynamic MITRE ATT&CK Mapping: T1110, T1046, T1190, T1078, T1059, T1070        |
|  - Threat Intelligence IoC Enrichment (IP, Domain, Hash, Reputation Scoring)      |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                   INCIDENT CORRELATION & LIFECYCLE MANAGEMENT                     |
|  - Automated Incident Creation for High / Critical Alerts                         |
|  - Incident Alerts Junction: `incident_alerts`                                    |
|  - Comprehensive Lifecycle Timeline: `incident_timeline`                          |
|    * Alert Ingestion & Correlation events                                         |
|    * Analyst Status Transitions (new -> investigating -> resolved)                |
|    * Investigation Notes & Analyst Assignment                                     |
|    * Response Action Execution Events                                             |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|             AI THREAT INVESTIGATION, RESPONSE ACTIONS & PDF REPORTING             |
|  - OpenRouter AI SOC Copilot (Root Cause Analysis, Impact, Mitigation Playbook)   |
|  - Simulated containment: Block IP, Reset Credentials, Isolate Host, Enable MFA   |
|  - Consolidated Incident Reports with one-click Professional PDF Export           |
|  - Real-time SOC Executive & Operational Dashboard Metrics                        |
+-----------------------------------------------------------------------------------+
```

---

## 2. Production Deployment Architecture

```
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│           Vercel                │       │           Ubuntu VM             │
│   React 19 + Vite 8 (SPA)       │       │    Security Log Shipper         │
│  https://<sentinelx>.vercel.app │       │  (auth.log / syslog stream)     │
└────────────────┬────────────────┘       └────────────────┬────────────────┘
                 │ HTTPS (REST API)                        │ HTTPS POST /api/logs/ingest
                 ▼                                         ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                                Render                                     │
│                     Node.js 24 + Express 5 Backend                        │
│                 https://<sentinelx-api>.onrender.com                      │
│                                                                           │
│  - Modular Detection & Normalization Engine                               │
│  - YARA 4.5.5 Malware Scanner Integration                                 │
│  - Health Checks (/health & /api/health)                                  │
│  - Graceful Shutdown & Ingestion Token Auth                               │
└─────────────────────┬───────────────────────────────┬─────────────────────┘
                      │ PostgreSQL (SSL Pooler)       │ AI Prompts / Completion
                      ▼                               ▼
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│          Supabase               │       │          OpenRouter             │
│   PostgreSQL 15/16/17 (Managed) │       │   AI Security Investigation     │
│   11 Relational Tables + Indexes│       │   (DeepSeek / Gemini / GPT-4o)  │
└─────────────────────────────────┘       └─────────────────────────────────┘
```

---

## 3. Technology Stack

- **Frontend**: React 19, Vite 8, Lucide React icons, Native High-Performance CSS, `html2canvas-pro` + `jspdf` for PDF export. Hosted on **Vercel**.
- **Backend**: Node.js v24.19.0, Express v5.2.1, `pg` v8.23.0, `cors`, `helmet`, `morgan`, `axios`. Hosted on **Render**.
- **Database**: PostgreSQL 17 / Supabase PostgreSQL with 11 relational tables, foreign key cascades, and 35 performance indexes.
- **AI Engine**: OpenRouter API (`deepseek/deepseek-chat` or `google/gemini-2.5-flash`).
- **Telemetry Collector**: Ubuntu Linux VM (`scripts/ubuntu_log_shipper.sh` or `scripts/linux_collector.py`).
- **Malware Scanner**: YARA v4.5.5 compiled malware signatures (`yara/rules/malware_rules.yar`).
- **Local Dev / Containerization**: Windows 11 Enterprise + Docker Compose (`docker-compose.yml`).
- **Code Quality**: Oxlint (0 warnings, 0 errors across 43 files).

---

## 4. Database Schema & Architecture

SentinelX uses a relational schema designed for high-throughput SOC telemetry:

| Table | Description |
|---|---|
| `log_sources` | Registered telemetry collectors and endpoints. |
| `raw_logs` | Immutable audit log of raw ingested messages before normalization. |
| `normalized_logs` | Structured logs with standardized IP, port, user, timestamp, and severity. |
| `alerts` | Detected security alerts with transparent risk scores and rule names. |
| `incidents` | Correlated security cases with assigned analyst, severity, and status. |
| `incident_alerts` | Many-to-many junction linking alerts to incidents. |
| `incident_timeline` | Chronological audit trail of all alerts, status updates, notes, and actions. |
| `threat_intelligence` | IoC indicator enrichments (IPs, hashes, usernames, reputation). |
| `mitre_attack` | Authentic MITRE ATT&CK technique and tactic mappings. |
| `response_actions` | Simulated containment actions (Block IP, Isolate Host, Reset Creds). |
| `ai_security_analysis` | Consolidated AI threat summaries and analyst playbooks. |

---

## 5. Deployment Guide

### A. Database Deployment: Supabase PostgreSQL

1. **Create Supabase Project**:
   - Go to [Supabase Dashboard](https://supabase.com/dashboard) and create a new project.
   - Note down your database password.
2. **Retrieve Connection String**:
   - Navigate to **Project Settings** → **Database** → **Connection String**.
   - Select **URI** (or **Session Pooler** on port 5432 / 6543).
   - Format: `postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres`
3. **Execute Migrations**:
   Run the idempotent SentinelX migration script against your Supabase instance:
   ```bash
   DATABASE_URL="postgresql://postgres.[ref]:[password]@[host]:[port]/postgres" node database/migrate.js
   ```
   *(Optionally seed initial telemetry)*:
   ```bash
   DATABASE_URL="postgresql://postgres.[ref]:[password]@[host]:[port]/postgres" node scripts/seed.js
   ```

---

### B. Backend Deployment: Render

1. **Deploy with Blueprint (`render.yaml`)**:
   - Push this repository to GitHub.
   - In [Render Dashboard](https://dashboard.render.com/), click **New** → **Blueprint**.
   - Connect your GitHub repo; Render reads `render.yaml` automatically.
2. **Or Deploy as Web Service Manually**:
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/health`
3. **Set Environment Variables on Render**:
   - `DATABASE_URL`: Your Supabase connection URI (e.g., `postgresql://postgres...`)
   - `PORT`: `10000` (Render assigns this automatically)
   - `CORS_ORIGIN`: Your Vercel frontend URL (e.g., `https://sentinelx.vercel.app`)
   - `OPENROUTER_API_KEY`: Your OpenRouter API key
   - `OPENROUTER_MODEL`: `deepseek/deepseek-chat` (or `google/gemini-2.5-flash`)
   - `LOG_INGESTION_TOKEN`: (Optional) Secret token for log shipper authentication
4. Note your Render service URL: `https://<your-service>.onrender.com`.

---

### C. Frontend Deployment: Vercel

1. **Import Project into Vercel**:
   - In [Vercel Dashboard](https://vercel.com/dashboard), click **Add New** → **Project**.
   - Connect your GitHub repo.
2. **Configure Project Settings**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. **Set Environment Variables on Vercel**:
   - `VITE_API_URL`: `https://<your-service>.onrender.com/api`
4. **Deploy**:
   - Click **Deploy**. Vercel will build and assign your production domain.
   - Update `CORS_ORIGIN` on your Render backend with your final Vercel domain.

---

### D. Ubuntu VM Log Shipper Setup

Stream security authentication events (`/var/log/auth.log`) from your Ubuntu VM to SentinelX:

1. **Copy Shipper Script to VM**:
   ```bash
   scp scripts/ubuntu_log_shipper.sh user@ubuntu-vm:/home/user/
   ```
2. **Execute Ingestion Test**:
   ```bash
   chmod +x ubuntu_log_shipper.sh
   ./ubuntu_log_shipper.sh --url https://<your-render-url>/api --test
   ```
3. **Run Real-Time Daemon / Tail**:
   ```bash
   sudo ./ubuntu_log_shipper.sh \
     --url https://<your-render-url>/api \
     --token "<your-ingestion-token>" \
     --tail
   ```
   *(Alternatively, run the universal Python collector)*:
   ```bash
   python3 scripts/linux_collector.py --url https://<your-render-url>/api --continuous
   ```

---

## 6. Local Development Guide

### Option 1: Native Windows 11 + PostgreSQL 17

1. **Install Dependencies**:
   ```powershell
   npm --prefix backend install
   npm --prefix frontend install
   ```
2. **Configure Environment**:
   - Copy `.env.example` to `backend/.env` and update credentials if needed.
3. **Database Setup**:
   ```powershell
   node database/migrate.js
   node scripts/seed.js
   ```
4. **Run Backend & Frontend**:
   ```powershell
   # Terminal 1: Backend
   npm --prefix backend start

   # Terminal 2: Frontend
   npm --prefix frontend run dev
   ```

### Option 2: Docker Compose (Full Stack)

Launch PostgreSQL, SentinelX Backend with native YARA, and React Frontend in isolated containers:
```bash
docker compose up --build
```
- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000/api`
- **PostgreSQL**: `localhost:5432`

---

## 7. Features & Detection Engine

### Detection Rules (`backend/src/detection/detectionRules.js`)
1. **Brute Force Detection (`BRUTE_FORCE_FAILED_LOGIN`)**: Threshold ≥ 5 failed login attempts from same IP within 5 minutes. MITRE T1110.
2. **Port Scan Sweep (`PORT_SCAN_SWEEP`)**: ≥ 5 distinct destination ports probed within 5 minutes. MITRE T1046.
3. **SQL Injection (`WEB_SQL_INJECTION`)**: RegEx signatures for SQLi attack payloads. MITRE T1190.
4. **Suspicious Login After Failures (`SUSPICIOUS_LOGIN_AFTER_FAILURES`)**: Failed attempts followed immediately by successful logon within 10 minutes. MITRE T1078.
5. **Malware Execution Indicators (`MALWARE_INDICATOR_DETECTED`)**: Known offensive security tools (Mimikatz, PowerShell `-enc`). MITRE T1059.001.
6. **Anomalous Security Activity (`ANOMALOUS_SECURITY_ACTIVITY`)**: High-volume request bursts or anomaly telemetry. MITRE T1070.

### AI Threat Investigation & Incident Response
- **OpenRouter AI Copilot**: Generates executive incident summaries, root cause analyses, attack likelihood estimations, and actionable containment playbooks.
- **Random Incident Generator**: One-click generation of authentic attack scenarios with realistic telemetry, MITRE ATT&CK mapping, threat intel IoCs, and audit timeline for live SOC training and demos.
- **Professional PDF Incident Reports**: Export pixel-perfect SOC incident reports including executive summaries, alert breakdowns, and full audit timelines with one click.

---

## 8. API Reference

Hosted under `/api`:

### Ingestion & Logs
- `POST /api/logs/ingest` — Ingest raw log or batch logs.
- `GET /api/logs/raw?limit=50&offset=0` — Retrieve paginated raw logs.
- `GET /api/normalized-logs` — Retrieve normalized security logs.
- `GET /api/log-sources` — Retrieve registered log sources.

### Detection & Alerts
- `POST /api/detection/run` — Executes detection rules, enriches threat intel, maps MITRE ATT&CK, creates incidents.
- `GET /api/alerts` — Retrieve all detected alerts with join metadata.
- `GET /api/alerts/:id/enrichment` — Retrieve MITRE ATT&CK and Threat Intel for an alert.
- `PATCH /api/alerts/:id/status` — Update alert triage status (`new`, `acknowledged`, `investigating`, `resolved`).

### Incidents & Lifecycle
- `GET /api/incidents` — List all security incidents.
- `POST /api/incidents/generate-random` — Generate an authentic random incident with full telemetry & timeline.
- `GET /api/incidents/:id` — Get full incident details with linked alerts, logs, and threat intel.
- `GET /api/incidents/:id/timeline` — Get chronological incident audit trail.
- `POST /api/incidents/:id/timeline` — Add manual investigation event or analyst note.
- `PATCH /api/incidents/:id/status` — Update incident status (`open`, `investigating`, `contained`, `resolved`).
- `PATCH /api/incidents/:id/details` — Update assigned analyst and investigation notes.
- `GET /api/incidents/:id/report` — Consolidated intelligence report.
- `POST /api/incidents/:id/ai-investigate` — Trigger AI threat investigation via OpenRouter.

### Response Actions & Dashboard
- `GET /api/response-actions` — List simulated response actions.
- `POST /api/response-actions` — Create response action for an incident.
- `POST /api/response-actions/:id/execute` — Execute and mark response action complete.
- `GET /api/dashboard/summary` — Dynamically calculated SOC metrics directly from PostgreSQL.
- `GET /health` / `GET /api/health` — Service health check & uptime probe.

---

## 9. Automated Test Suite & Code Quality

```powershell
# Run backend test suite
npm --prefix backend test

# Run end-to-end audit verification
node tests/verify_audit.js

# Run frontend linter
npm --prefix frontend run lint

# Build frontend for production
npm --prefix frontend run build
```

- **Backend Tests**: 40/40 tests passing (100%)
- **Verification Audit**: 15/15 audit checks passing (100%)
- **Frontend Linter**: 0 warnings, 0 errors
- **Production Build**: 550ms Vite build with 0 errors
