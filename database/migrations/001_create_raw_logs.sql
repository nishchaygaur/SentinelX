-- SentinelX Migration 001: Create raw_logs table and performance indexes
-- Idempotent migration script

CREATE TABLE IF NOT EXISTS raw_logs (
    id BIGSERIAL PRIMARY KEY,
    source_id INTEGER REFERENCES log_sources(id) ON DELETE SET NULL,
    timestamp TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    raw_message TEXT NOT NULL,
    source_type VARCHAR(50),
    hostname VARCHAR(255),
    ip_address VARCHAR(45),
    username VARCHAR(100),
    severity VARCHAR(20) DEFAULT 'info',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for raw_logs
CREATE INDEX IF NOT EXISTS idx_raw_logs_timestamp ON raw_logs (timestamp);
CREATE INDEX IF NOT EXISTS idx_raw_logs_source_id ON raw_logs (source_id);
CREATE INDEX IF NOT EXISTS idx_raw_logs_source_type ON raw_logs (source_type);

-- Indexes for normalized_logs
CREATE INDEX IF NOT EXISTS idx_normalized_logs_event_time ON normalized_logs (event_time);
CREATE INDEX IF NOT EXISTS idx_normalized_logs_source_ip ON normalized_logs (source_ip);
CREATE INDEX IF NOT EXISTS idx_normalized_logs_event_type ON normalized_logs (event_type);
CREATE INDEX IF NOT EXISTS idx_normalized_logs_source_id ON normalized_logs (source_id);

-- Indexes for alerts
CREATE INDEX IF NOT EXISTS idx_alerts_log_id ON alerts (log_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts (status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts (severity);
CREATE INDEX IF NOT EXISTS idx_alerts_detection_rule ON alerts (detection_rule);
CREATE INDEX IF NOT EXISTS idx_alerts_detected_at ON alerts (detected_at);

-- Indexes for incident_alerts
CREATE INDEX IF NOT EXISTS idx_incident_alerts_alert_id ON incident_alerts (alert_id);
CREATE INDEX IF NOT EXISTS idx_incident_alerts_incident_id ON incident_alerts (incident_id);

-- Indexes for incident_timeline
CREATE INDEX IF NOT EXISTS idx_incident_timeline_incident_id ON incident_timeline (incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_timeline_event_time ON incident_timeline (event_time);

-- Indexes for threat_intelligence
CREATE INDEX IF NOT EXISTS idx_threat_intelligence_alert_id ON threat_intelligence (alert_id);
CREATE INDEX IF NOT EXISTS idx_threat_intelligence_indicator_value ON threat_intelligence (indicator_value);

-- Indexes for mitre_attack
CREATE INDEX IF NOT EXISTS idx_mitre_attack_alert_id ON mitre_attack (alert_id);
CREATE INDEX IF NOT EXISTS idx_mitre_attack_technique_id ON mitre_attack (technique_id);

-- Indexes for response_actions
CREATE INDEX IF NOT EXISTS idx_response_actions_incident_id ON response_actions (incident_id);
