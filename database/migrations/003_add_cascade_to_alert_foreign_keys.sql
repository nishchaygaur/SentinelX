-- Migration 003: Ensure ON DELETE CASCADE for mitre_attack and threat_intelligence
ALTER TABLE mitre_attack DROP CONSTRAINT IF EXISTS mitre_attack_alert_id_fkey;
ALTER TABLE mitre_attack 
    ADD CONSTRAINT mitre_attack_alert_id_fkey 
    FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE CASCADE;

ALTER TABLE threat_intelligence DROP CONSTRAINT IF EXISTS threat_intelligence_alert_id_fkey;
ALTER TABLE threat_intelligence 
    ADD CONSTRAINT threat_intelligence_alert_id_fkey 
    FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE CASCADE;
