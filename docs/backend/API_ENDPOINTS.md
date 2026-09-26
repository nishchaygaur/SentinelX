# SentinelX — Complete API Endpoints Catalog

Below is the definitive catalog of all endpoints implemented in the SentinelX Express backend:

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/health` | Service health check | None |
| `GET` | `/api/health` | Alias health check | None |
| `GET` | `/api/log-sources` | Retrieve registered log sources | None |
| `POST` | `/api/logs/ingest` | Ingest single or batch raw logs | `x-ingestion-token` (if configured) |
| `GET` | `/api/logs/raw` | Retrieve paginated raw logs (`?limit=50&offset=0`) | None |
| `GET` | `/api/normalized-logs` | Retrieve normalized security logs | None |
| `POST` | `/api/normalized-logs` | Directly insert pre-normalized log | None |
| `POST` | `/api/detection/run` | Execute 6 detection rules across normalized logs | None |
| `GET` | `/api/alerts` | Retrieve detected alerts with join metadata | None |
| `GET` | `/api/alerts/:id/enrichment` | Retrieve MITRE ATT&CK & Threat Intel for alert | None |
| `PATCH` | `/api/alerts/:id/status` | Update alert status (`new`, `acknowledged`, etc.) | None |
| `GET` | `/api/incidents` | List all security incidents | None |
| `POST` | `/api/incidents/generate-random`| Generate synthetic attack incident with telemetry | None |
| `GET` | `/api/incidents/:id` | Get incident details, linked alerts, & logs | None |
| `GET` | `/api/incidents/:id/timeline` | Retrieve chronological incident audit timeline | None |
| `POST` | `/api/incidents/:id/timeline` | Add analyst note or custom timeline event | None |
| `PATCH` | `/api/incidents/:id/status` | Update status (`open`, `investigating`, `contained`, `resolved`) | None |
| `PATCH` | `/api/incidents/:id/details`| Update assigned analyst and investigation notes | None |
| `GET` | `/api/incidents/:id/report` | Aggregated JSON intelligence report | None |
| `GET` | `/api/incidents/:id/report/pdf` | Download server-generated multi-page vector PDF | None |
| `POST` | `/api/ai/alerts/:id/analyze` | Trigger OpenRouter AI threat investigation | None |
| `GET` | `/api/ai/alerts/:id/analysis` | Retrieve stored AI investigation assessment | None |
| `GET` | `/api/response-actions` | List simulated response actions | None |
| `POST` | `/api/response-actions` | Create containment response action for incident | None |
| `POST` | `/api/response-actions/:id/execute` | Mark response action executed & log to timeline | None |
| `GET` | `/api/response-actions/:id` | Get single response action | None |
| `GET` | `/api/dashboard/summary` | Live SQL aggregated SOC executive & operational metrics | None |
