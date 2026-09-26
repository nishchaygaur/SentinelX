# SentinelX — Incident Management & Case Tracking

## 1. Automated Correlation

When an alert is generated with severity **`high`** or **`critical`**, SentinelX automatically correlates and generates an incident case in the `incidents` table:
- Automatically links the alert via `incident_alerts (incident_id, alert_id)`.
- Creates an initial creation entry in `incident_timeline`.
- Sets initial status to `open`.

---

## 2. Chronological Timeline (`incident_timeline`)

The `incident_timeline` table provides an immutable, chronological audit trail for the incident case, capturing:
- `alert`: Alert detection and association events.
- `incident`: Case creation and status transitions.
- `investigation`: Analyst notes and AI assessment updates.
- `response`: Simulated containment actions created and executed.

### Add Timeline Note:
`POST /api/incidents/:id/timeline`
```json
{
  "event_title": "Investigated Bastion Server",
  "event_description": "Verified SSH keys and confirmed no unauthorized public keys in authorized_keys.",
  "event_type": "investigation",
  "severity": "medium"
}
```

---

## 3. Incident Status & Details APIs

- `PATCH /api/incidents/:id/status`: Set status to `open`, `investigating`, `contained`, or `resolved`.
- `PATCH /api/incidents/:id/details`: Update `assigned_to` analyst and append to `investigation_notes`.
- `GET /api/incidents/:id/report`: Consolidated incident payload containing incident, alerts, normalized logs, MITRE techniques, threat intelligence, timeline, and AI analyses.
