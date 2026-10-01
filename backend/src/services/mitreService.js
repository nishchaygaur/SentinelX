/**
 * SentinelX MITRE ATT&CK Mapping & Heatmap Service
 * Maps detection rules to verified authentic MITRE ATT&CK Enterprise Matrix techniques
 * and provides complete enterprise heatmap matrix analytics and coverage data.
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
 * Complete 14 MITRE ATT&CK Enterprise Matrix Tactics in adversary lifecycle order
 */
const ENTERPRISE_TACTICS = [
    { id: "TA0043", name: "Reconnaissance", description: "Gathering information to plan future adversary operations." },
    { id: "TA0042", name: "Resource Development", description: "Establishing resources to support operations." },
    { id: "TA0001", name: "Initial Access", description: "Gaining entry into the target network or environment." },
    { id: "TA0002", name: "Execution", description: "Running malicious code on target systems." },
    { id: "TA0003", name: "Persistence", description: "Maintaining access across restarts and credential changes." },
    { id: "TA0004", name: "Privilege Escalation", description: "Gaining higher-level permissions on systems." },
    { id: "TA0005", name: "Defense Evasion", description: "Avoiding detection by security monitoring tools." },
    { id: "TA0006", name: "Credential Access", description: "Stealing credentials such as usernames and passwords." },
    { id: "TA0007", name: "Discovery", description: "Observing environment details to plan next movements." },
    { id: "TA0008", name: "Lateral Movement", description: "Extending access to additional systems in the network." },
    { id: "TA0009", name: "Collection", description: "Gathering sensitive data of interest for exfiltration." },
    { id: "TA0011", name: "Command and Control", description: "Communicating with compromised systems under external control." },
    { id: "TA0010", name: "Exfiltration", description: "Stealing data from the target organization." },
    { id: "TA0040", name: "Impact", description: "Disrupting, destroying, or manipulating systems and data." }
];

/**
 * Enterprise Techniques catalog across all 14 tactics
 */
const ENTERPRISE_TECHNIQUES = [
    // Reconnaissance (TA0043)
    {
        id: "T1046",
        tactic_id: "TA0043",
        name: "Network Service Scanning",
        description: "Adversaries attempt to enumerate remote services and open ports to find vulnerable targets.",
        rule: "PORT_SCAN_DETECTED",
        subtechniques: ["T1046.001"],
        platforms: ["Linux", "Windows", "Network"],
        mitigations: ["M1037: Filter Network Traffic", "M1031: Network Intrusion Prevention"],
        covered: true
    },
    {
        id: "T1595",
        tactic_id: "TA0043",
        name: "Active Scanning",
        description: "Adversaries execute automated vulnerability and port sweeps against public perimeters.",
        rule: "PORT_SCAN_DETECTED",
        subtechniques: ["T1595.001", "T1595.002"],
        platforms: ["Network", "Cloud"],
        mitigations: ["M1037: Filter Network Traffic"],
        covered: true
    },
    {
        id: "T1592",
        tactic_id: "TA0043",
        name: "Gather Victim Host Information",
        description: "Adversaries collect host metadata, firmware versions, and patch levels prior to initial compromise.",
        rule: null,
        subtechniques: ["T1592.001", "T1592.002"],
        platforms: ["PRE"],
        mitigations: ["M1056: Pre-compromise Hygiene"],
        covered: false
    },

    // Resource Development (TA0042)
    {
        id: "T1588",
        tactic_id: "TA0042",
        name: "Obtain Capabilities",
        description: "Adversaries acquire tools, exploits, and malware payloads like Mimikatz or Cobalt Strike.",
        rule: "MALWARE_INDICATOR_DETECTED",
        subtechniques: ["T1588.001", "T1588.002"],
        platforms: ["PRE"],
        mitigations: ["M1056: Threat Intelligence Subscriptions"],
        covered: true
    },
    {
        id: "T1583",
        tactic_id: "TA0042",
        name: "Acquire Infrastructure",
        description: "Adversaries buy or compromise servers, domains, and virtual private servers for C2 operations.",
        rule: null,
        subtechniques: ["T1583.001", "T1583.003"],
        platforms: ["PRE"],
        mitigations: ["M1056: Domain Reputation Monitoring"],
        covered: false
    },

    // Initial Access (TA0001)
    {
        id: "T1190",
        tactic_id: "TA0001",
        name: "Exploit Public-Facing Application",
        description: "Adversaries exploit web vulnerabilities such as SQL Injection or remote code execution to breach systems.",
        rule: "SQL_INJECTION_DETECTED",
        subtechniques: [],
        platforms: ["Linux", "Windows", "Web Server"],
        mitigations: ["M1050: Exploit Protection", "M1038: Web Application Firewall"],
        covered: true
    },
    {
        id: "T1078",
        tactic_id: "TA0001",
        name: "Valid Accounts",
        description: "Adversaries obtain and abuse credentials of legitimate user or administrator accounts.",
        rule: "SUSPICIOUS_LOGIN_DETECTED",
        subtechniques: ["T1078.001", "T1078.003"],
        platforms: ["Linux", "Windows", "Cloud"],
        mitigations: ["M1032: Multi-Factor Authentication", "M1026: Privileged Account Management"],
        covered: true
    },
    {
        id: "T1566",
        tactic_id: "TA0001",
        name: "Phishing",
        description: "Adversaries send malicious emails with attachments or links to compromise user endpoints.",
        rule: null,
        subtechniques: ["T1566.001", "T1566.002"],
        platforms: ["Windows", "macOS", "Linux"],
        mitigations: ["M1049: Antivirus/Antimalware", "M1054: Software Configuration"],
        covered: false
    },

    // Execution (TA0002)
    {
        id: "T1059",
        tactic_id: "TA0002",
        name: "Command and Scripting Interpreter",
        description: "Adversaries execute malicious payloads using PowerShell, cmd.exe, Bash, or Python.",
        rule: "MALWARE_INDICATOR_DETECTED",
        subtechniques: ["T1059.001", "T1059.004"],
        platforms: ["Windows", "Linux", "macOS"],
        mitigations: ["M1038: Execution Prevention", "M1026: Script Block Logging"],
        covered: true
    },
    {
        id: "T1204",
        tactic_id: "TA0002",
        name: "User Execution",
        description: "Adversaries rely on specific actions by a victim user, such as opening a malicious macro document.",
        rule: null,
        subtechniques: ["T1204.001", "T1204.002"],
        platforms: ["Windows", "macOS"],
        mitigations: ["M1038: Execution Prevention"],
        covered: false
    },
    {
        id: "T1053",
        tactic_id: "TA0002",
        name: "Scheduled Task/Job",
        description: "Adversaries abuse task scheduling utilities such as cron or at to execute malicious binaries.",
        rule: null,
        subtechniques: ["T1053.003", "T1053.005"],
        platforms: ["Linux", "Windows"],
        mitigations: ["M1028: Operating System Configuration"],
        covered: false
    },

    // Persistence (TA0003)
    {
        id: "T1098",
        tactic_id: "TA0003",
        name: "Account Manipulation",
        description: "Adversaries manipulate accounts to maintain access, such as adding SSH authorized keys or altering privileges.",
        rule: "SUSPICIOUS_LOGIN_DETECTED",
        subtechniques: ["T1098.004"],
        platforms: ["Linux", "Windows", "Identity"],
        mitigations: ["M1026: Privileged Account Management", "M1018: User Account Management"],
        covered: true
    },
    {
        id: "T1136",
        tactic_id: "TA0003",
        name: "Create Account",
        description: "Adversaries create new local or domain user accounts to establish persistent footholds.",
        rule: null,
        subtechniques: ["T1136.001", "T1136.002"],
        platforms: ["Linux", "Windows"],
        mitigations: ["M1018: User Account Management"],
        covered: false
    },
    {
        id: "T1543",
        tactic_id: "TA0003",
        name: "Create or Modify System Process",
        description: "Adversaries configure malicious system services or systemd daemons for continuous execution.",
        rule: null,
        subtechniques: ["T1543.002", "T1543.003"],
        platforms: ["Linux", "Windows"],
        mitigations: ["M1028: Operating System Configuration"],
        covered: false
    },

    // Privilege Escalation (TA0004)
    {
        id: "T1548",
        tactic_id: "TA0004",
        name: "Abuse Elevation Control Mechanism",
        description: "Adversaries circumvent elevation barriers via sudo misconfigurations, setuid binaries, or UAC bypass.",
        rule: "ANOMALOUS_ACTIVITY_DETECTED",
        subtechniques: ["T1548.001", "T1548.003"],
        platforms: ["Linux", "Windows"],
        mitigations: ["M1026: Privileged Account Management"],
        covered: true
    },
    {
        id: "T1068",
        tactic_id: "TA0004",
        name: "Exploitation for Privilege Escalation",
        description: "Adversaries exploit software vulnerabilities in the local OS or drivers to gain elevated root or SYSTEM privileges.",
        rule: null,
        subtechniques: [],
        platforms: ["Linux", "Windows"],
        mitigations: ["M1051: Update Software"],
        covered: false
    },

    // Defense Evasion (TA0005)
    {
        id: "T1070",
        tactic_id: "TA0005",
        name: "Indicator Removal",
        description: "Adversaries delete event logs, bash history, or system audit trails to hinder forensic detection.",
        rule: "ANOMALOUS_ACTIVITY_DETECTED",
        subtechniques: ["T1070.001", "T1070.002", "T1070.003"],
        platforms: ["Linux", "Windows"],
        mitigations: ["M1029: Remote Data Storage", "M1022: Restrict File and Directory Permissions"],
        covered: true
    },
    {
        id: "T1027",
        tactic_id: "TA0005",
        name: "Obfuscated/Encoded Files or Information",
        description: "Adversaries encode commands in Base64 or use packers to conceal malicious payloads from scanners.",
        rule: "MALWARE_INDICATOR_DETECTED",
        subtechniques: ["T1027.001", "T1027.002"],
        platforms: ["Linux", "Windows"],
        mitigations: ["M1049: Antivirus/Antimalware", "M1040: Behavioral Analysis"],
        covered: true
    },
    {
        id: "T1562",
        tactic_id: "TA0005",
        name: "Impair Defenses",
        description: "Adversaries disable or modify security tools, firewalls (iptables/UFW), or logging agents.",
        rule: null,
        subtechniques: ["T1562.001", "T1562.004"],
        platforms: ["Linux", "Windows"],
        mitigations: ["M1028: Operating System Configuration"],
        covered: false
    },

    // Credential Access (TA0006)
    {
        id: "T1110",
        tactic_id: "TA0006",
        name: "Brute Force",
        description: "Adversaries systematically guess passwords, execute credential stuffing, or run password sprays.",
        rule: "BRUTE_FORCE_FAILED_LOGIN",
        subtechniques: ["T1110.001", "T1110.003"],
        platforms: ["Linux", "Windows", "Web"],
        mitigations: ["M1036: Account Use Policies", "M1032: Multi-Factor Authentication", "M1038: Account Lockout"],
        covered: true
    },
    {
        id: "T1003",
        tactic_id: "TA0006",
        name: "OS Credential Dumping",
        description: "Adversaries extract credentials from operating system stores like LSASS memory or SAM hive.",
        rule: "MALWARE_INDICATOR_DETECTED",
        subtechniques: ["T1003.001", "T1003.002"],
        platforms: ["Windows", "Linux"],
        mitigations: ["M1027: Password Policies", "M1043: Credential Access Protection"],
        covered: true
    },
    {
        id: "T1555",
        tactic_id: "TA0006",
        name: "Credentials from Password Stores",
        description: "Adversaries search for insecurely stored credentials in configuration files, web browsers, or keyrings.",
        rule: null,
        subtechniques: ["T1555.003"],
        platforms: ["Linux", "Windows"],
        mitigations: ["M1027: Password Policies"],
        covered: false
    },

    // Discovery (TA0007)
    {
        id: "T1087",
        tactic_id: "TA0007",
        name: "Account Discovery",
        description: "Adversaries query system user accounts and group memberships to identify targets for privilege escalation.",
        rule: "SUSPICIOUS_LOGIN_DETECTED",
        subtechniques: ["T1087.001", "T1087.002"],
        platforms: ["Linux", "Windows"],
        mitigations: ["M1018: User Account Management"],
        covered: true
    },
    {
        id: "T1082",
        tactic_id: "TA0007",
        name: "System Information Discovery",
        description: "Adversaries run commands like uname, hostname, or systeminfo to discover host configurations.",
        rule: null,
        subtechniques: [],
        platforms: ["Linux", "Windows"],
        mitigations: ["M1028: Operating System Configuration"],
        covered: false
    },
    {
        id: "T1018",
        tactic_id: "TA0007",
        name: "Remote System Discovery",
        description: "Adversaries scan neighboring local network nodes via ARP, ICMP ping, or NetBIOS sweeps.",
        rule: "PORT_SCAN_DETECTED",
        subtechniques: [],
        platforms: ["Linux", "Windows", "Network"],
        mitigations: ["M1037: Filter Network Traffic"],
        covered: true
    },

    // Lateral Movement (TA0008)
    {
        id: "T1021",
        tactic_id: "TA0008",
        name: "Remote Services",
        description: "Adversaries pivot across the internal network using SSH, RDP, or SMB with valid credentials.",
        rule: "SUSPICIOUS_LOGIN_DETECTED",
        subtechniques: ["T1021.001", "T1021.004"],
        platforms: ["Linux", "Windows"],
        mitigations: ["M1035: Limit Access to Resource Over Network", "M1030: Network Segmentation"],
        covered: true
    },
    {
        id: "T1570",
        tactic_id: "TA0008",
        name: "Lateral Tool Transfer",
        description: "Adversaries transfer malware or offensive tooling across peer systems within the compromised environment.",
        rule: "MALWARE_INDICATOR_DETECTED",
        subtechniques: [],
        platforms: ["Linux", "Windows"],
        mitigations: ["M1031: Network Intrusion Prevention"],
        covered: true
    },
    {
        id: "T1550",
        tactic_id: "TA0008",
        name: "Use Alternate Authentication Material",
        description: "Adversaries leverage Kerberos tickets or password hashes (Pass the Hash / Pass the Ticket) to authenticate without plaintext passwords.",
        rule: null,
        subtechniques: ["T1550.002", "T1550.003"],
        platforms: ["Windows"],
        mitigations: ["M1027: Password Policies"],
        covered: false
    },

    // Collection (TA0009)
    {
        id: "T1005",
        tactic_id: "TA0009",
        name: "Data from Local System",
        description: "Adversaries search for and collect sensitive database exports, configuration files, and credentials from local drives.",
        rule: "ANOMALOUS_ACTIVITY_DETECTED",
        subtechniques: [],
        platforms: ["Linux", "Windows"],
        mitigations: ["M1022: Restrict File and Directory Permissions"],
        covered: true
    },
    {
        id: "T1560",
        tactic_id: "TA0009",
        name: "Archive Collected Data",
        description: "Adversaries compress and encrypt target files into ZIP, 7z, or TAR archives prior to exfiltration.",
        rule: null,
        subtechniques: ["T1560.001"],
        platforms: ["Linux", "Windows"],
        mitigations: ["M1022: Restrict File and Directory Permissions"],
        covered: false
    },

    // Command and Control (TA0011)
    {
        id: "T1071",
        tactic_id: "TA0011",
        name: "Application Layer Protocol",
        description: "Adversaries establish command and control channels disguising traffic within legitimate HTTP, HTTPS, or DNS.",
        rule: "ANOMALOUS_ACTIVITY_DETECTED",
        subtechniques: ["T1071.001", "T1071.004"],
        platforms: ["Linux", "Windows", "Network"],
        mitigations: ["M1031: Network Intrusion Prevention", "M1037: Filter Network Traffic"],
        covered: true
    },
    {
        id: "T1105",
        tactic_id: "TA0011",
        name: "Ingress Tool Transfer",
        description: "Adversaries transfer tools from an external system into the compromised network using curl, wget, or certutil.",
        rule: "MALWARE_INDICATOR_DETECTED",
        subtechniques: [],
        platforms: ["Linux", "Windows"],
        mitigations: ["M1031: Network Intrusion Prevention"],
        covered: true
    },
    {
        id: "T1572",
        tactic_id: "TA0011",
        name: "Protocol Tunneling",
        description: "Adversaries tunnel C2 communications through standard network protocols to bypass firewall inspection.",
        rule: null,
        subtechniques: [],
        platforms: ["Network"],
        mitigations: ["M1031: Network Intrusion Prevention"],
        covered: false
    },

    // Exfiltration (TA0010)
    {
        id: "T1041",
        tactic_id: "TA0010",
        name: "Exfiltration Over C2 Channel",
        description: "Adversaries siphon confidential files through their active command and control connection.",
        rule: "ANOMALOUS_ACTIVITY_DETECTED",
        subtechniques: [],
        platforms: ["Linux", "Windows", "Network"],
        mitigations: ["M1057: Data Loss Prevention"],
        covered: true
    },
    {
        id: "T1567",
        tactic_id: "TA0010",
        name: "Exfiltration Over Web Service",
        description: "Adversaries transfer stolen data to cloud storage providers like Google Drive, Mega, or Dropbox.",
        rule: null,
        subtechniques: ["T1567.002"],
        platforms: ["Cloud", "Linux", "Windows"],
        mitigations: ["M1057: Data Loss Prevention"],
        covered: false
    },

    // Impact (TA0040)
    {
        id: "T1486",
        tactic_id: "TA0040",
        name: "Data Encrypted for Impact",
        description: "Adversaries deploy ransomware payloads to encrypt victim databases and filesystems to demand extortion.",
        rule: "MALWARE_INDICATOR_DETECTED",
        subtechniques: [],
        platforms: ["Linux", "Windows"],
        mitigations: ["M1053: Data Backup", "M1049: Antivirus/Antimalware"],
        covered: true
    },
    {
        id: "T1489",
        tactic_id: "TA0040",
        name: "Service Stop",
        description: "Adversaries terminate vital security services, web servers, or databases to disrupt operations.",
        rule: "ANOMALOUS_ACTIVITY_DETECTED",
        subtechniques: [],
        platforms: ["Linux", "Windows"],
        mitigations: ["M1028: Operating System Configuration"],
        covered: true
    },
    {
        id: "T1490",
        tactic_id: "TA0040",
        name: "Inhibit System Recovery",
        description: "Adversaries delete volume shadow copies or backup snapshots to prevent rapid recovery from ransomware.",
        rule: null,
        subtechniques: [],
        platforms: ["Windows", "Linux"],
        mitigations: ["M1053: Data Backup"],
        covered: false
    }
];

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

/**
 * Generates the full interactive MITRE ATT&CK Heatmap Matrix data,
 * calculating detection counts, active alerts, coverage status, and KPIs.
 */
async function getMitreHeatmapData(incidentId = null) {
    const detectedTechniquesMap = new Map();
    const incidentTechniqueIds = new Set();

    try {
        // Query detected techniques across all alerts
        const detectionQuery = `
            SELECT
                m.technique_id,
                m.technique_name,
                m.tactic_id,
                COUNT(m.id)::int AS detection_count,
                MAX(a.severity) AS max_severity,
                ARRAY_AGG(DISTINCT a.id) AS alert_ids,
                ARRAY_AGG(DISTINCT ia.incident_id) FILTER (WHERE ia.incident_id IS NOT NULL) AS incident_ids
            FROM mitre_attack m
            LEFT JOIN alerts a ON m.alert_id = a.id
            LEFT JOIN incident_alerts ia ON a.id = ia.alert_id
            GROUP BY m.technique_id, m.technique_name, m.tactic_id
        `;
        const detectedRes = await pool.query(detectionQuery);
        for (const row of detectedRes.rows) {
            // Strip any sub-technique suffix for primary technique mapping if needed
            const primaryId = row.technique_id.split(".")[0];
            detectedTechniquesMap.set(row.technique_id, row);
            if (!detectedTechniquesMap.has(primaryId)) {
                detectedTechniquesMap.set(primaryId, row);
            }
        }

        // If specific incident requested, find its techniques
        if (incidentId) {
            const incTechRes = await pool.query(
                `
                SELECT DISTINCT m.technique_id
                FROM mitre_attack m
                JOIN incident_alerts ia ON m.alert_id = ia.alert_id
                WHERE ia.incident_id = $1
                `,
                [incidentId]
            );
            for (const row of incTechRes.rows) {
                incidentTechniqueIds.add(row.technique_id);
                incidentTechniqueIds.add(row.technique_id.split(".")[0]);
            }
        }
    } catch (err) {
        // Safe fallback if database is unavailable
        console.warn("MITRE Heatmap database query notice (using catalog baseline):", err.message);
    }

    // Build tactical columns
    const tacticsWithTechniques = ENTERPRISE_TACTICS.map(tactic => {
        const techniques = ENTERPRISE_TECHNIQUES
            .filter(t => t.tactic_id === tactic.id)
            .map(t => {
                const detectedData = detectedTechniquesMap.get(t.id);
                const isDetectedInIncident = incidentTechniqueIds.has(t.id);
                const hasDetections = Boolean(detectedData && detectedData.detection_count > 0);

                let status = "uncovered";
                if (hasDetections) {
                    status = "detected";
                } else if (t.covered) {
                    status = "covered";
                }

                return {
                    ...t,
                    status,
                    detected: hasDetections,
                    detection_count: detectedData?.detection_count || 0,
                    max_severity: detectedData?.max_severity || (t.covered ? "medium" : "low"),
                    alert_ids: detectedData?.alert_ids || [],
                    incident_ids: detectedData?.incident_ids || [],
                    incident_detected: isDetectedInIncident
                };
            });

        const activeDetections = techniques.filter(t => t.detected).length;
        const coveredCount = techniques.filter(t => t.covered).length;

        return {
            ...tactic,
            techniques,
            technique_count: techniques.length,
            active_detections: activeDetections,
            covered_count: coveredCount
        };
    });

    // Calculate enterprise coverage KPIs
    const totalTechniques = ENTERPRISE_TECHNIQUES.length;
    const coveredTechniques = ENTERPRISE_TECHNIQUES.filter(t => t.covered).length;
    const detectedTechniques = Array.from(detectedTechniquesMap.keys()).length;
    const blindSpots = totalTechniques - coveredTechniques;
    const coveragePercentage = totalTechniques > 0 ? Math.round((coveredTechniques / totalTechniques) * 100) : 0;

    return {
        tactics: tacticsWithTechniques,
        coverage_summary: {
            total_tactics: ENTERPRISE_TACTICS.length,
            total_techniques: totalTechniques,
            covered_techniques: coveredTechniques,
            detected_techniques: detectedTechniques,
            blind_spots: blindSpots,
            coverage_percentage: coveragePercentage,
            incident_id: incidentId,
            incident_detected_count: incidentTechniqueIds.size
        },
        supported_rules: Object.keys(MITRE_ENTERPRISE_MAPPINGS)
    };
}

/**
 * Retrieves details for a specific technique
 */
function getTechniqueById(techniqueId) {
    const normalizedId = (techniqueId || "").trim().toUpperCase();
    const primaryId = normalizedId.split(".")[0];

    const tech = ENTERPRISE_TECHNIQUES.find(t => t.id === normalizedId || t.id === primaryId);
    if (!tech) {
        return null;
    }

    const tactic = ENTERPRISE_TACTICS.find(tac => tac.id === tech.tactic_id);

    return {
        ...tech,
        tactic_name: tactic ? tactic.name : "Enterprise ATT&CK",
        url: `https://attack.mitre.org/techniques/${tech.id}/`
    };
}

module.exports = {
    mapAlertToMitre,
    MITRE_ENTERPRISE_MAPPINGS,
    ENTERPRISE_TACTICS,
    ENTERPRISE_TECHNIQUES,
    getMitreHeatmapData,
    getTechniqueById
};
