# SentinelX — Telemetry & Service Monitoring

## 1. Health & Liveness Endpoints

- `GET /health`: Returns HTTP 200 with uptime timestamp.
- `GET /api/dashboard/summary`: Live performance and telemetry aggregation check.

---

## 2. Ingestion Monitoring Metrics

- Total logs ingested count (`SELECT COUNT(*) FROM normalized_logs`).
- Daily alert volume trends (`SELECT severity, COUNT(*) FROM alerts GROUP BY severity`).
- Average fleet risk score.
