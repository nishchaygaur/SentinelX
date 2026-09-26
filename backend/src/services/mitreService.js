/**
 * SentinelX MITRE ATT&CK Mapping Service
 * Maps detection rules to verified authentic MITRE ATT&CK Enterprise Matrix techniques.
 */

const pool = require("../config/db");

const MITRE_ENTERPRISE_MAPPINGS = {
    BRUTE_FORCE_FAILED_LOGIN: {
        tactic_id: "TA0006",
        tactic_name: "Credential Access",
        technique_id: "T1110",
        technique_name: "Brute Force",
        subtechnique_id: "T1110.001",
        subtechnique_name: "Password Guessing",
        description: "Adversaries may use brute force techniques to attempt authentication credentials by systematically guessing passwords."
    },
    PORT_SCAN_DETECTED: {
        tactic_id: "TA0043",
        tactic_name: "Reconnaissance",
        technique_id: "T1046",
        technique_name: "Network Service Scanning",
        subtechnique_id: null,
        subtechnique_name: null,
        description: "Adversaries may attempt to get a listing of services running on remote hosts to identify vulnerable applications and open ports."
    },
    SQL_INJECTION_DETECTED: {
        tactic_id: "TA0001",
        tactic_name: "Initial Access",
        technique_id: "T1190",
        technique_name: "Exploit Public-Facing Application",
        subtechnique_id: null,
        subtechnique_name: null,
        description: "Adversaries may exploit a vulnerability in a public-facing application, such as SQL injection, to gain unauthorized access or execute code."
    },
    SUSPICIOUS_LOGIN_DETECTED: {
        tactic_id: "TA0001",
        tactic_name: "Initial Access",
        technique_id: "T1078",
        technique_name: "Valid Accounts",
        subtechnique_id: "T1078.003",
        subtechnique_name: "Local Accounts",
        description: "Adversaries may obtain and abuse credentials of existing valid accounts to gain access and evade detection."
    },
    MALWARE_INDICATOR_DETECTED: {
        tactic_id: "TA0002",
        tactic_name: "Execution",
        technique_id: "T1059.001",
        technique_name: "Command and Scripting Interpreter: PowerShell",
        subtechnique_id: "T1059.001",
        subtechnique_name: "PowerShell",
        description: "Adversaries may abuse PowerShell commands and scripts for execution, credential dumping, and payload execution."
    },
    ANOMALOUS_ACTIVITY_DETECTED: {
        tactic_id: "TA0005",
        tactic_name: "Defense Evasion",
        technique_id: "T1070",
        technique_name: "Indicator Removal",
        subtechnique_id: null,
        subtechnique_name: null,
        description: "Adversaries may delete, tamper with, or anomalously manipulate log records, artifacts, or services to evade detection."
    }
};

// Aliases for interchangeable rule names
MITRE_ENTERPRISE_MAPPINGS.PORT_SCAN_SWEEP = MITRE_ENTERPRISE_MAPPINGS.PORT_SCAN_DETECTED;
MITRE_ENTERPRISE_MAPPINGS.WEB_SQL_INJECTION = MITRE_ENTERPRISE_MAPPINGS.SQL_INJECTION_DETECTED;
MITRE_ENTERPRISE_MAPPINGS.SUSPICIOUS_LOGIN_AFTER_FAILURES = MITRE_ENTERPRISE_MAPPINGS.SUSPICIOUS_LOGIN_DETECTED;
MITRE_ENTERPRISE_MAPPINGS.ANOMALOUS_SECURITY_ACTIVITY = MITRE_ENTERPRISE_MAPPINGS.ANOMALOUS_ACTIVITY_DETECTED;


/**
 * Enriches an alert with MITRE ATT&CK technique details.
 */
async function mapAlertToMitre(alertId, detectionRule) {
    if (!alertId || !detectionRule) return null;

    const mapping = MITRE_ENTERPRISE_MAPPINGS[detectionRule];
    if (!mapping) return null;

    try {
        const existing = await pool.query(
            `
            SELECT id FROM mitre_attack
            WHERE alert_id = $1 AND technique_id = $2
            LIMIT 1
            `,
            [alertId, mapping.technique_id]
        );

        if (existing.rows.length === 0) {
            const inserted = await pool.query(
                `
                INSERT INTO mitre_attack
                (
                    alert_id, tactic_id, tactic_name,
                    technique_id, technique_name, subtechnique_id,
                    subtechnique_name, description
                )
                VALUES
                (
                    $1, $2, $3,
                    $4, $5, $6,
                    $7, $8
                )
                RETURNING *
                `,
                [
                    alertId,
                    mapping.tactic_id,
                    mapping.tactic_name,
                    mapping.technique_id,
                    mapping.technique_name,
                    mapping.subtechnique_id,
                    mapping.subtechnique_name,
                    mapping.description
                ]
            );
            return inserted.rows[0];
        }

        return existing.rows[0];
    } catch (err) {
        console.error("MITRE ATT&CK mapping warning:", err.message);
        return null;
    }
}

module.exports = {
    mapAlertToMitre,
    MITRE_ENTERPRISE_MAPPINGS
};
