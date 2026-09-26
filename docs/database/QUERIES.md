# SentinelX — Essential SQL Queries Reference

## 1. SOC Dashboard Dynamic KPI Aggregation

```sql
SELECT
    (SELECT COUNT(*) FROM normalized_logs) AS total_logs,
    (SELECT COUNT(*) FROM alerts) AS total_alerts,
    (SELECT COUNT(*) FROM alerts WHERE severity IN ('high', 'critical')) AS high_priority_alerts,
    (SELECT COUNT(*) FROM incidents WHERE status = 'open') AS open_incidents,
    (SELECT COUNT(*) FROM incidents) AS total_incidents,
    (SELECT COUNT(*) FROM response_actions WHERE status = 'completed') AS completed_responses,
    COALESCE((SELECT ROUND(AVG(risk_score), 2) FROM alerts), 0) AS average_risk_score;
```

---

## 2. Alerts Joined with MITRE & Threat Intelligence

```sql
SELECT 
    a.id, a.title, a.severity, a.risk_score, a.status, a.detected_at,
    nl.source_ip, nl.destination_ip, nl.username, nl.hostname,
    m.technique_id, m.technique_name,
    ti.indicator_value, ti.threat_name, ti.reputation
FROM alerts a
LEFT JOIN normalized_logs nl ON a.log_id = nl.id
LEFT JOIN mitre_attack m ON a.id = m.alert_id
LEFT JOIN threat_intelligence ti ON a.id = ti.alert_id
ORDER BY a.detected_at DESC
LIMIT 50;
```

---

## 3. Incident Full Report Aggregation

```sql
-- Retrieve incident details
SELECT * FROM incidents WHERE id = $1;

-- Retrieve linked alerts
SELECT a.* FROM alerts a
JOIN incident_alerts ia ON a.id = ia.alert_id
WHERE ia.incident_id = $1;

-- Retrieve full chronological timeline
SELECT * FROM incident_timeline
WHERE incident_id = $1
ORDER BY event_time ASC;

-- Retrieve simulated response actions
SELECT * FROM response_actions
WHERE incident_id = $1
ORDER BY created_at ASC;
```
