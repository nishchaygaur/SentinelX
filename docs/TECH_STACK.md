# SentinelX — Technology Stack & Architecture Choices

## 1. Core Technology Selection

```
┌────────────────────────────────────────────────────────────────────────┐
│                       SENTINELX TECHNOLOGY STACK                       │
├────────────────────┬───────────────────────────────────────────────────┤
│ Tier               │ Technologies                                      │
├────────────────────┼───────────────────────────────────────────────────┤
│ Frontend           │ React 19, Vite 8, Lucide React, Native CSS Tokens │
│ Backend            │ Node.js 24, Express 5, Axios, Helmet, Morgan      │
│ Database           │ PostgreSQL 17, pg driver, Supabase Connection Pool│
│ Threat Detection   │ Custom Deterministic Rule Engine, YARA v4.5.5     │
│ Threat Intel & AI  │ MITRE ATT&CK Framework, OpenRouter API (DeepSeek) │
│ Reporting          │ PDFKit (Server-Side Streaming PDF Engine)         │
│ Telemetry Shippers │ Bash 5 (cURL/jq), Python 3.10+ urllib             │
│ Quality & Tooling  │ Oxlint (0 errors/warnings), Custom Test Harness   │
│ Deployment         │ Vercel, Render, Supabase, Docker Compose          │
└────────────────────┴───────────────────────────────────────────────────┘
```

---

## 2. Technology Rationale & Evaluation

### Frontend: React 19 & Vite 8
- **Why React 19**: Leverage native concurrent rendering features and reactive state hooks without overhead from heavier frameworks.
- **Why Vite 8**: Sub-second Hot Module Replacement (HMR) and optimized Rollup production bundling (~550ms build time).
- **Why Native CSS over Tailwind**: Direct control over dark-mode cybersecurity palette, high contrast tokens, zero utility class bloat, and fast render execution.

### Backend: Node.js 24 & Express 5
- **Why Express 5**: Modernized HTTP routing, built-in async error delegation, stable middleware ecosystem, and low latency.
- **Why Native Driver (`pg`) over ORM**: Direct control over connection pooling, parameterized queries, transaction safety, and sub-millisecond query execution.

### Database: PostgreSQL 17 / Supabase
- **Why PostgreSQL**: ACID transaction guarantees, native `INET` network address types, native `JSONB` document indexing, and foreign key cascades.
- **Why Supabase**: Cloud-managed PostgreSQL with automated backups, SSL enforcement, and serverless connection pooling via PgBouncer.

### Reporting: PDFKit
- **Why Server-Side PDFKit**: Vector-sharp PDF reports created directly from PostgreSQL data streams without headless browser overhead or CSS rendering quirks.
