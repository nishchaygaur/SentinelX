# SentinelX Documentation Library

Welcome to the official technical documentation for **SentinelX** — an enterprise-grade AI-Powered Security Operations Center (SOC) and Threat Intelligence Platform.

---

## Documentation Structure

The SentinelX documentation is structured into the following specialized categories:

| Section | Path | Description |
|---|---|---|
| **Root Overview** | `docs/` | Architectural overviews, features, requirements, technology choices, and repository structure. |
| **Setup & Installation** | `docs/setup/` | Complete guides for local development, Windows, Docker, Ubuntu VMs, YARA, and environment variables. |
| **Backend Architecture** | `docs/backend/` | Detailed breakdown of Express routes, controllers, detection rules, risk scoring, AI copilot, and PDF generation. |
| **Frontend Architecture** | `docs/frontend/` | React 19 architecture, component hierarchy, SOC dashboard views, real-time polling, and styling tokens. |
| **Database & Schema** | `docs/database/` | PostgreSQL 17 schema, 11 core tables, foreign keys, 35 indexes, migration runner, and seed datasets. |
| **Log Ingestion & Shipper** | `docs/ingestion/` | Ingestion pipeline, Ubuntu log shipper (`auth.log`), Python collector, and 5 normalized log sources. |
| **Cloud Deployment** | `docs/deployment/` | Production setups across Vercel (frontend), Render (backend), and Supabase (PostgreSQL). |
| **Testing & Quality** | `docs/testing/` | Master test runner (40 tests), detection unit tests, end-to-end audit (15 stages), and Postman collection. |
| **Security & Hardening** | `docs/security/` | Helmet headers, dynamic CORS, token authentication, parameterized queries, and threat boundaries. |
| **Operations & Runbooks** | `docs/operations/` | Operational runbooks, troubleshooting guide, telemetry monitoring, backup procedures, and incident handling. |
| **Visual Architecture Diagrams** | `docs/diagrams/` | Mermaid diagrams depicting data flow, system boundaries, incident lifecycle, and cloud deployment topology. |
| **Reference & Standards** | `docs/reference/` | Cybersecurity glossary, configuration references, CLI commands, API error codes, and platform changelog. |

---

## How to Read & Access Documentation

1. **Embedded Web UI (`/docs`)**:
   SentinelX features a dedicated, full-browser documentation explorer integrated directly into the React frontend. Navigate to `/docs` in your browser to browse and search documentation without needing local markdown viewers.
2. **Local Repository Browsing**:
   All documentation is stored as standard GitHub-flavored Markdown in the `docs/` folder of the repository.
3. **Interactive Postman Collection**:
   A ready-to-import API test suite is available at `docs/SentinelX.postman_collection.json`.

---

## Technical Source of Truth

Every document in this library is strictly grounded in the actual SentinelX codebase:
- Express 5.2 backend routes (`backend/src/routes/`)
- PostgreSQL 17 schema and migrations (`database/schema.sql`, `database/migrations/`)
- Detection rules and risk scoring algorithms (`backend/src/detection/detectionRules.js`)
- Ubuntu log shipping scripts (`scripts/ubuntu_log_shipper.sh`, `scripts/linux_collector.py`)
- YARA malware rule scanner (`yara/rules/malware_rules.yar`)

*Note: Features marked as **[Future / Planned]** represent architectural roadmap items and are explicitly distinguished from verified production implementations.*
