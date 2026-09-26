# SentinelX — Backend Integration & Unit Tests

## 1. Detection Rule Unit Tests (`tests/detection.test.js`)

Tests cover 12 assertions across 6 rules:
- **Brute Force**: Positive (5+ failed attempts trigger); Negative (below 5 does not trigger).
- **Port Scan**: Positive (5+ unique ports trigger); Negative (repeated connections to single port ignored).
- **SQL Injection**: Positive (`UNION SELECT` payload triggers); Negative (normal GET request ignored).
- **Suspicious Login**: Positive (failures followed by success triggers); Negative (normal login ignored).
- **Malware Indicator**: Positive (Mimikatz / PowerShell `-enc` triggers); Negative (standard process creation ignored).
- **Anomalous Activity**: Positive (critical anomaly event triggers); Negative (benign baseline ignored).

---

## 2. API Integration Tests (`tests/backend.test.js`)

Tests cover 17 endpoints:
- Health check (`GET /api/health`)
- Log sources (`GET /api/log-sources`)
- Log ingestion (`POST /api/logs/ingest`)
- Normalized logs (`GET /api/normalized-logs`)
- Detection runner (`POST /api/detection/run`)
- Alert retrieval & enrichment (`GET /api/alerts`, `GET /api/alerts/:id/enrichment`)
- Incident lifecycle (`GET /api/incidents`, `GET /api/incidents/:id`, `PATCH /api/incidents/:id/status`)
- Incident timeline (`GET /api/incidents/:id/timeline`, `POST /api/incidents/:id/timeline`)
- Response actions (`GET /api/response-actions`, `POST /api/response-actions`, `POST /api/response-actions/:id/execute`)
- Dashboard metrics (`GET /api/dashboard/summary`)

---

## 3. Running Backend Tests

```bash
npm --prefix backend test
```
