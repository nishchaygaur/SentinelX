-- Migration 002: Ensure ai_security_analysis alias view exists for compatibility
CREATE OR REPLACE VIEW ai_security_analysis AS 
SELECT 
    id,
    alert_id,
    summary,
    threat_assessment,
    risk_explanation,
    investigation_steps,
    recommended_response,
    model_name,
    provider,
    raw_response,
    created_at
FROM ai_analysis;
