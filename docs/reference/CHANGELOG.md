# SentinelX Platform Changelog

## [1.0.0] - Production Release

### Architecture & Core
- Implemented Express 5.2 backend with Helmet, dynamic CORS, and connection pooling.
- Designed authoritative 11-table PostgreSQL 17 schema with 35 indexes and foreign key cascades.
- Built idempotent migration runner (`database/migrate.js`) and initial migrations.

### Ingestion & Normalization
- Deployed universal ingestion API (`POST /api/logs/ingest`) supporting single and batch payloads.
- Implemented fail-safe `logValidator.js` with IP/Port/Timestamp sanitization.
- Built 5 source parsers: Windows Event Log, Linux SSH, Web Server, Firewall, and Application.
- Shipped Ubuntu VM log shipper (`ubuntu_log_shipper.sh`) and Python collector (`linux_collector.py`).

### Detection, Scoring & Correlation
- Engineered 6 deterministic detection rules with sliding window correlation.
- Designed explainable 5-factor risk scoring formula (0–100 integer range).
- Built automated MITRE ATT&CK technique and tactic mapper.
- Integrated threat intelligence IoC scoring with RFC1918 private IP classification.
- Implemented automated incident creation for High/Critical alerts with chronological audit timeline.

### AI, Response & Reporting
- Integrated OpenRouter API (DeepSeek / Gemini) with JSON structure enforcement for SOC Copilot.
- Built simulated containment response action workflow.
- Developed server-side streaming multi-page vector PDF report generator using PDFKit.
- Implemented synthetic random incident generator for SOC training and live demonstrations.
- Added native YARA v4.5.5 scanner with curated webshell, ransomware, and Mimikatz signatures.

### Frontend & Documentation
- Built React 19 + Vite 8 SOC console with 9 operational and executive views.
- Created dedicated full-browser Documentation Explorer at `/docs`.
- Published 77 comprehensive technical documentation articles covering all platform domains.
