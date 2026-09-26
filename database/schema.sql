-- ==============================================================================
-- SentinelX Authoritative Database Schema
-- Database: sentinelx
-- PostgreSQL 18+ Compatible
-- ==============================================================================

-- 1. Schema Migrations Table
CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    version VARCHAR(255) UNIQUE NOT NULL,
    applied_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Log Sources Table
CREATE TABLE IF NOT EXISTS log_sources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    description TEXT,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Raw Logs Table
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

-- 4. Normalized Logs Table
CREATE TABLE IF NOT EXISTS normalized_logs (
    id BIGSERIAL PRIMARY KEY,
    source_id INTEGER REFERENCES log_sources(id) ON DELETE SET NULL,
    event_time TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    event_type VARCHAR(100),
    severity VARCHAR(20),
    source_ip INET,
    destination_ip INET,
    source_port INTEGER,
    destination_port INTEGER,
    username VARCHAR(100),
    hostname VARCHAR(255),
    protocol VARCHAR(20),
    action VARCHAR(50),
    message TEXT,
    raw_log TEXT,
    normalized_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Alerts Table
CREATE TABLE IF NOT EXISTS alerts (
    id BIGSERIAL PRIMARY KEY,
    log_id BIGINT REFERENCES normalized_logs(id) ON DELETE SET NULL,
    alert_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    detection_rule VARCHAR(100),
    status VARCHAR(30) NOT NULL DEFAULT 'new',
    risk_score INTEGER,
    detected_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Incidents Table
CREATE TABLE IF NOT EXISTS incidents (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    severity VARCHAR(20) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'open',
    priority INTEGER DEFAULT 50,
    assigned_to VARCHAR(100),
    investigation_notes TEXT,
    opened_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP WITHOUT TIME ZONE
);

-- 7. Incident Alerts Mapping Table
CREATE TABLE IF NOT EXISTS incident_alerts (
    incident_id BIGINT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    alert_id BIGINT NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
    linked_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (incident_id, alert_id)
);

-- 8. Incident Timeline Table
CREATE TABLE IF NOT EXISTS incident_timeline (
    id BIGSERIAL PRIMARY KEY,
    incident_id BIGINT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    event_title VARCHAR(255) NOT NULL,
    event_description TEXT,
    severity VARCHAR(20),
    status VARCHAR(30),
    reference_id BIGINT,
    event_time TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Threat Intelligence Table
CREATE TABLE IF NOT EXISTS threat_intelligence (
    id BIGSERIAL PRIMARY KEY,
    alert_id BIGINT REFERENCES alerts(id) ON DELETE CASCADE,
    indicator_type VARCHAR(50) NOT NULL,
    indicator_value VARCHAR(255) NOT NULL,
    threat_type VARCHAR(100),
    threat_name VARCHAR(255),
    source VARCHAR(100),
    reputation VARCHAR(50),
    confidence INTEGER,
    description TEXT,
    first_seen TIMESTAMP WITHOUT TIME ZONE,
    last_seen TIMESTAMP WITHOUT TIME ZONE,
    raw_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. MITRE ATT&CK Mapping Table
CREATE TABLE IF NOT EXISTS mitre_attack (
    id BIGSERIAL PRIMARY KEY,
    alert_id BIGINT REFERENCES alerts(id) ON DELETE CASCADE,
    tactic_id VARCHAR(20),
    tactic_name VARCHAR(100),
    technique_id VARCHAR(20),
    technique_name VARCHAR(255),
    subtechnique_id VARCHAR(20),
    subtechnique_name VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Response Actions Table
CREATE TABLE IF NOT EXISTS response_actions (
    id BIGSERIAL PRIMARY KEY,
    incident_id BIGINT REFERENCES incidents(id) ON DELETE CASCADE,
    action_type VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    executed_by VARCHAR(100) DEFAULT 'SentinelX Automated Response',
    execution_result TEXT,
    executed_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. AI Analysis Table
CREATE TABLE IF NOT EXISTS ai_analysis (
    id BIGSERIAL PRIMARY KEY,
    alert_id BIGINT NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
    summary TEXT,
    threat_assessment TEXT,
    risk_explanation TEXT,
    investigation_steps TEXT,
    recommended_response TEXT,
    model_name VARCHAR(100),
    provider VARCHAR(50),
    raw_response JSONB,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- Indexes
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_raw_logs_timestamp ON raw_logs (timestamp);
CREATE INDEX IF NOT EXISTS idx_raw_logs_source_id ON raw_logs (source_id);
CREATE INDEX IF NOT EXISTS idx_raw_logs_source_type ON raw_logs (source_type);

CREATE INDEX IF NOT EXISTS idx_normalized_logs_event_time ON normalized_logs (event_time);
CREATE INDEX IF NOT EXISTS idx_normalized_logs_source_ip ON normalized_logs (source_ip);
CREATE INDEX IF NOT EXISTS idx_normalized_logs_event_type ON normalized_logs (event_type);
CREATE INDEX IF NOT EXISTS idx_normalized_logs_source_id ON normalized_logs (source_id);

CREATE INDEX IF NOT EXISTS idx_alerts_log_id ON alerts (log_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts (status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts (severity);
CREATE INDEX IF NOT EXISTS idx_alerts_detection_rule ON alerts (detection_rule);
CREATE INDEX IF NOT EXISTS idx_alerts_detected_at ON alerts (detected_at);

CREATE INDEX IF NOT EXISTS idx_incident_alerts_alert_id ON incident_alerts (alert_id);
CREATE INDEX IF NOT EXISTS idx_incident_alerts_incident_id ON incident_alerts (incident_id);

CREATE INDEX IF NOT EXISTS idx_incident_timeline_incident_id ON incident_timeline (incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_timeline_event_time ON incident_timeline (event_time);

CREATE INDEX IF NOT EXISTS idx_threat_intelligence_alert_id ON threat_intelligence (alert_id);
CREATE INDEX IF NOT EXISTS idx_threat_intelligence_indicator_value ON threat_intelligence (indicator_value);

CREATE INDEX IF NOT EXISTS idx_mitre_attack_alert_id ON mitre_attack (alert_id);
CREATE INDEX IF NOT EXISTS idx_mitre_attack_technique_id ON mitre_attack (technique_id);

CREATE INDEX IF NOT EXISTS idx_response_actions_incident_id ON response_actions (incident_id);

-- 13. AI Security Analysis Alias View
CREATE OR REPLACE VIEW ai_security_analysis AS
SELECT * FROM ai_analysis;
