# SentinelX — System Architecture

## 1. System Overview

SentinelX is designed as a distributed, decoupled three-tier security operations platform consisting of:
1. **Telemetry Layer**: Remote Linux shippers, Windows event collectors, and application daemons sending syslog and event streams over HTTPS.
2. **Core Processing & Detection Layer (Node.js 24 + Express 5)**: Stateless API microservices handling ingestion validation, regex parsing, detection correlation, threat enrichment, AI integration, and PDF document generation.
3. **Data Persistence Layer (PostgreSQL 17 / Supabase)**: Relational storage engine comprising 11 relational tables, foreign key constraints with cascade behaviors, and 35 performance B-tree indexes.
4. **Presentation Layer (React 19 + Vite 8)**: Single-page application rendering real-time operational and executive SOC views with native CSS and Lucide React icons.

---

## 2. Architectural Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MULTI-SOURCE TELEMETRY                            │
│  Ubuntu Shipper (auth.log) | Windows Event Logs | Nginx CLF | UFW Firewall  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTPS POST /api/logs/ingest
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       SENTINELX BACKEND (EXPRESS 5)                         │
│                                                                             │
│  ┌───────────────────────┐ ┌──────────────────────┐ ┌────────────────────┐  │
│  │ Ingestion Controller  │ │ Log Normalizer       │ │ Detection Engine   │  │
│  │ - Token verification  │ │ - Windows 4625/4624  │ │ - 6 Core Rules     │  │
│  │ - Input sanitization  │ │ - Linux SSH auth     │ │ - Sliding window   │  │
│  │ - Raw log storage     │ │ - CLF / Combined     │ │ - Risk calculation │  │
│  └───────────────────────┘ └──────────────────────┘ └────────────────────┘  │
│                                                                             │
│  ┌───────────────────────┐ ┌──────────────────────┐ ┌────────────────────┐  │
│  │ Threat Intelligence   │ │ AI Threat Copilot    │ │ PDFKit Generator   │  │
│  │ - IoC indicator match │ │ - OpenRouter API     │ │ - Executive summary│  │
│  │ - RFC1918 filtering   │ │ - DeepSeek / Gemini  │ │ - Full audit trail │  │
│  └───────────────────────┘ └──────────────────────┘ └────────────────────┘  │
└──────────────────────┬───────────────────────────────────────┬──────────────┘
                       │ SQL Connection Pool                   │ REST API
                       ▼                                       ▼
┌──────────────────────────────────────────────┐ ┌────────────────────────────┐
│         POSTGRESQL 17 / SUPABASE             │ │    REACT 19 SPA (VERCEL)   │
│  - log_sources        - incidents            │ │ - SOC Dashboard Summary    │
│  - raw_logs           - incident_alerts      │ │ - Alerts Management Table  │
│  - normalized_logs    - incident_timeline    │ │ - Incident Case Viewer     │
│  - alerts             - response_actions     │ │ - Threat Intel & MITRE Tab │
│  - threat_intel       - ai_analysis          │ │ - AI Threat Copilot UI     │
│  - mitre_attack       (35 Performance Indexes│ │ - Dedicated /docs Explorer │
└──────────────────────────────────────────────┘ └────────────────────────────┘
```

---

## 3. Telemetry Ingestion Architecture

### Ingestion Flow
1. Telemetry shippers format system logs into JSON arrays or objects.
2. Payloads are transmitted via HTTPS POST to `/api/logs/ingest`.
3. If `LOG_INGESTION_TOKEN` is configured on the backend, the shipper supplies an `x-ingestion-token` or `Authorization: Bearer <token>` header.
4. **Validation Phase** (`logValidator.js`):
   - IP addresses are validated using `net.isIP()`.
   - Ports are checked to fall within `1–65535`.
   - Severities are normalized to `low`, `medium`, `high`, or `critical`.
   - Missing timestamps are backfilled with UTC ISO-8601 strings.
5. **Raw Persistence**: Valid and partially sanitized entries are written to `raw_logs`.
6. **Normalization Phase** (`logNormalizer.js`):
   - Source-specific parsers extract username, IP, port, action, and event type.
   - Structured records are written to `normalized_logs`.

---

## 4. Detection & Correlation Pipeline

1. The detection engine is triggered via `POST /api/detection/run` or during automated seed/replay cycles.
2. The engine executes 6 modular rule evaluators concurrently over normalized logs:
   - **Brute Force**: Detects `>= 5` failed logins from a single source within a 5-minute sliding window.
   - **Port Scan**: Detects `>= 5` unique destination ports probed by a single IP.
   - **SQL Injection**: Matches against signatures (`UNION SELECT`, `OR '1'='1`, `information_schema`, `DROP TABLE`).
   - **Suspicious Login**: Evaluates failed attempts followed by successful logon within 10 minutes, or privileged account logins.
   - **Malware Indicator**: Matches artifacts like Mimikatz, PowerShell obfuscation (`-enc`), or ransomware extensions.
   - **Anomalous Activity**: Identifies statistical spikes where high-severity events exceed 40% of traffic.
3. Every triggered detection is scored using the 5-factor risk model.
4. Alerts are created in `alerts`.
5. High or Critical alerts trigger automated creation of an entry in `incidents`, linked via `incident_alerts`, and recorded in `incident_timeline`.

---

## 5. Persistence Architecture

The database architecture employs foreign key cascades on alert deletion, ensuring referential integrity:
- `alerts.log_id -> normalized_logs.id ON DELETE SET NULL`
- `incidents` correlated to `alerts` via `incident_alerts (incident_id, alert_id) ON DELETE CASCADE`
- `incident_timeline.incident_id -> incidents.id ON DELETE CASCADE`
- `threat_intelligence.alert_id -> alerts.id ON DELETE CASCADE`
- `mitre_attack.alert_id -> alerts.id ON DELETE CASCADE`
- `response_actions.incident_id -> incidents.id ON DELETE CASCADE`
- `ai_analysis.alert_id -> alerts.id ON DELETE CASCADE`
