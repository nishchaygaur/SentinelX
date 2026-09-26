# SentinelX — Tables Reference & Data Dictionary

## 1. `log_sources`
Stores registered log emitters.
- `id` (SERIAL PRIMARY KEY)
- `name` (VARCHAR(255) UNIQUE NOT NULL)
- `source_type` (VARCHAR(50) NOT NULL): `windows_event_log`, `linux_ssh`, `web_server`, `firewall`, `application`
- `description` (TEXT)
- `enabled` (BOOLEAN DEFAULT true)
- `created_at` (TIMESTAMP)

## 2. `raw_logs`
Immutable archive of incoming raw telemetry.
- `id` (BIGSERIAL PRIMARY KEY)
- `source_id` (INTEGER REFERENCES log_sources(id) ON DELETE SET NULL)
- `timestamp` (TIMESTAMP)
- `raw_message` (TEXT NOT NULL)
- `source_type` (VARCHAR(50))
- `hostname` (VARCHAR(255))
- `ip_address` (VARCHAR(45))
- `username` (VARCHAR(100))
- `severity` (VARCHAR(20) DEFAULT 'info')
- `metadata` (JSONB)
- `created_at` (TIMESTAMP)

## 3. `normalized_logs`
Standardized telemetry ready for detection.
- `id` (BIGSERIAL PRIMARY KEY)
- `source_id` (INTEGER REFERENCES log_sources(id) ON DELETE SET NULL)
- `event_time` (TIMESTAMP)
- `event_type` (VARCHAR(100))
- `severity` (VARCHAR(20))
- `source_ip` (INET)
- `destination_ip` (INET)
- `source_port` (INTEGER)
- `destination_port` (INTEGER)
- `username` (VARCHAR(100))
- `hostname` (VARCHAR(255))
- `protocol` (VARCHAR(20))
- `action` (VARCHAR(50))
- `message` (TEXT)
- `raw_log` (TEXT)
- `normalized_data` (JSONB)
- `created_at` (TIMESTAMP)

## 4. `alerts`
Security detections with risk scores.
- `id` (BIGSERIAL PRIMARY KEY)
- `log_id` (BIGINT REFERENCES normalized_logs(id) ON DELETE SET NULL)
- `alert_type` (VARCHAR(100) NOT NULL)
- `severity` (VARCHAR(20) NOT NULL): `low`, `medium`, `high`, `critical`
- `title` (VARCHAR(255) NOT NULL)
- `description` (TEXT)
- `detection_rule` (VARCHAR(100))
- `status` (VARCHAR(30) DEFAULT 'new')
- `risk_score` (INTEGER): 0–100
- `detected_at` (TIMESTAMP)
- `created_at` (TIMESTAMP)

## 5. `incidents`
Correlated security cases.
- `id` (BIGSERIAL PRIMARY KEY)
- `title` (VARCHAR(255) NOT NULL)
- `description` (TEXT)
- `severity` (VARCHAR(20) NOT NULL)
- `status` (VARCHAR(30) DEFAULT 'open'): `open`, `investigating`, `contained`, `resolved`
- `priority` (INTEGER DEFAULT 50)
- `assigned_to` (VARCHAR(100))
- `investigation_notes` (TEXT)
- `opened_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- `closed_at` (TIMESTAMP)

## 6. `incident_alerts`
Junction table linking alerts to incidents.
- `incident_id` (BIGINT REFERENCES incidents(id) ON DELETE CASCADE)
- `alert_id` (BIGINT REFERENCES alerts(id) ON DELETE CASCADE)
- `linked_at` (TIMESTAMP)
- `PRIMARY KEY (incident_id, alert_id)`

## 7. `incident_timeline`
Chronological audit events.
- `id` (BIGSERIAL PRIMARY KEY)
- `incident_id` (BIGINT REFERENCES incidents(id) ON DELETE CASCADE)
- `event_type` (VARCHAR(50) NOT NULL): `alert`, `incident`, `investigation`, `response`
- `event_title` (VARCHAR(255) NOT NULL)
- `event_description` (TEXT)
- `severity` (VARCHAR(20))
- `status` (VARCHAR(30))
- `reference_id` (BIGINT)
- `event_time` (TIMESTAMP)

## 8. `threat_intelligence`
IoC indicator data.
- `id` (BIGSERIAL PRIMARY KEY)
- `alert_id` (BIGINT REFERENCES alerts(id) ON DELETE CASCADE)
- `indicator_type` (VARCHAR(50)): `ip`, `domain`, `hash`, `cve`
- `indicator_value` (VARCHAR(255) NOT NULL)
- `threat_type` (VARCHAR(100))
- `threat_name` (VARCHAR(255))
- `source` (VARCHAR(100))
- `reputation` (VARCHAR(50)): `malicious`, `suspicious`, `clean`, `internal`
- `confidence` (INTEGER)
- `description` (TEXT)
- `raw_data` (JSONB)

## 9. `mitre_attack`
ATT&CK technique linkages.
- `id` (BIGSERIAL PRIMARY KEY)
- `alert_id` (BIGINT REFERENCES alerts(id) ON DELETE CASCADE)
- `tactic_id` (VARCHAR(20))
- `tactic_name` (VARCHAR(100))
- `technique_id` (VARCHAR(20))
- `technique_name` (VARCHAR(255))
- `subtechnique_id` (VARCHAR(20))
- `subtechnique_name` (VARCHAR(255))
- `description` (TEXT)

## 10. `response_actions`
Containment simulations.
- `id` (BIGSERIAL PRIMARY KEY)
- `incident_id` (BIGINT REFERENCES incidents(id) ON DELETE CASCADE)
- `action_type` (VARCHAR(100) NOT NULL)
- `description` (TEXT)
- `status` (VARCHAR(30) DEFAULT 'pending'): `pending`, `completed`, `failed`
- `executed_by` (VARCHAR(100))
- `execution_result` (TEXT)
- `executed_at` (TIMESTAMP)

## 11. `ai_analysis`
AI threat assessments.
- `id` (BIGSERIAL PRIMARY KEY)
- `alert_id` (BIGINT REFERENCES alerts(id) ON DELETE CASCADE)
- `summary` (TEXT)
- `threat_assessment` (TEXT)
- `risk_explanation` (TEXT)
- `investigation_steps` (TEXT)
- `recommended_response` (TEXT)
- `model_name` (VARCHAR(100))
- `provider` (VARCHAR(50))
- `raw_response` (JSONB)
