/**
 * SentinelX Deterministic Database Seeder
 * Populates realistic cybersecurity telemetry across all 5 log sources:
 * - Windows Event Logs (4625, 4624, 4688)
 * - Linux SSH Logs (Failed/Accepted passwords, invalid user)
 * - Web Server Logs (CLF, Combined, SQL Injection probes)
 * - Firewall Logs (iptables / UFW drops and rejects)
 * - Application Logs (Security exceptions, tracebacks, privilege checks)
 *
 * Automatically triggers the detection engine to generate:
 * - Alerts with calculated risk scores
 * - MITRE ATT&CK mappings
 * - Threat intelligence indicator enrichments
 * - Incidents with timelines and response actions
 */

const path = require("path");
const backendDir = path.join(__dirname, "../backend");
require(path.join(backendDir, "node_modules/dotenv")).config({ path: path.join(backendDir, ".env") });
const pool = require(path.join(backendDir, "src/config/db"));
const { normalizeLog } = require(path.join(backendDir, "src/ingestion/logNormalizer"));
const { executeDetectionEngine } = require(path.join(backendDir, "src/detection/detectionRules"));

const DEFAULT_SOURCES = [
    { name: "Windows Event Logs", type: "windows_events", host: "dc01.corp.sentinelx.local", ip: "10.0.0.10" },
    { name: "Linux SSH Logs", type: "linux_ssh", host: "srv-bastion.sentinelx.io", ip: "10.0.0.15" },
    { name: "Web Server Logs", type: "web_server", host: "web-prod-01.sentinelx.io", ip: "10.0.0.20" },
    { name: "Firewall Logs", type: "firewall", host: "edge-fw01.perimeter.net", ip: "10.0.0.1" },
    { name: "Application Logs", type: "application", host: "api-gateway.sentinelx.internal", ip: "10.0.0.25" }
];

async function seed() {
    console.log("==================================================");
    console.log("       SENTINELX TELEMETRY DATABASE SEEDER        ");
    console.log("==================================================\n");

    const client = await pool.connect();
    try {
        // 1. Ensure Log Sources exist
        console.log("[1/5] Ensuring default log sources...");
        const sourceMap = {};
        for (const src of DEFAULT_SOURCES) {
            const res = await client.query(
                `
                INSERT INTO log_sources (name, source_type, description, enabled)
                VALUES ($1, $2, $3, true)
                ON CONFLICT (name) DO UPDATE SET source_type = EXCLUDED.source_type
                RETURNING id, source_type
                `,
                [src.name, src.type, `${src.name} ingestion endpoint`]
            );
            sourceMap[res.rows[0].source_type] = res.rows[0].id;
        }
        console.log(`  -> Configured ${Object.keys(sourceMap).length} log sources.`);

        // 2. Define realistic attack scenarios and benign traffic
        console.log("[2/5] Synthesizing authentic multi-source security logs...");
        const now = Date.now();
        const rawTelemetry = [
            // SCENARIO 1: Linux SSH Brute Force (6 failed attempts)
            {
                source_type: "linux_ssh",
                raw_message: "Sep 24 02:01:10 srv-bastion sshd[14101]: Failed password for invalid user admin from 185.220.101.5 port 41201 ssh2",
                offset_sec: -300
            },
            {
                source_type: "linux_ssh",
                raw_message: "Sep 24 02:01:15 srv-bastion sshd[14102]: Failed password for invalid user admin from 185.220.101.5 port 41202 ssh2",
                offset_sec: -280
            },
            {
                source_type: "linux_ssh",
                raw_message: "Sep 24 02:01:20 srv-bastion sshd[14103]: Failed password for invalid user admin from 185.220.101.5 port 41203 ssh2",
                offset_sec: -260
            },
            {
                source_type: "linux_ssh",
                raw_message: "Sep 24 02:01:25 srv-bastion sshd[14104]: Failed password for invalid user admin from 185.220.101.5 port 41204 ssh2",
                offset_sec: -240
            },
            {
                source_type: "linux_ssh",
                raw_message: "Sep 24 02:01:30 srv-bastion sshd[14105]: Failed password for invalid user admin from 185.220.101.5 port 41205 ssh2",
                offset_sec: -220
            },
            {
                source_type: "linux_ssh",
                raw_message: "Sep 24 02:01:35 srv-bastion sshd[14106]: Failed password for invalid user admin from 185.220.101.5 port 41206 ssh2",
                offset_sec: -200
            },

            // SCENARIO 2: External Port Scan Sweep (Firewall dropped packets across ports 21, 22, 23, 80, 443, 3389)
            {
                source_type: "firewall",
                raw_message: "Sep 24 02:05:01 edge-fw01 kernel: [UFW BLOCK] IN=eth0 OUT= SRC=45.142.182.100 DST=10.0.0.1 PROTO=TCP SPT=55100 DPT=21",
                offset_sec: -180
            },
            {
                source_type: "firewall",
                raw_message: "Sep 24 02:05:02 edge-fw01 kernel: [UFW BLOCK] IN=eth0 OUT= SRC=45.142.182.100 DST=10.0.0.1 PROTO=TCP SPT=55101 DPT=22",
                offset_sec: -175
            },
            {
                source_type: "firewall",
                raw_message: "Sep 24 02:05:03 edge-fw01 kernel: [UFW BLOCK] IN=eth0 OUT= SRC=45.142.182.100 DST=10.0.0.1 PROTO=TCP SPT=55102 DPT=23",
                offset_sec: -170
            },
            {
                source_type: "firewall",
                raw_message: "Sep 24 02:05:04 edge-fw01 kernel: [UFW BLOCK] IN=eth0 OUT= SRC=45.142.182.100 DST=10.0.0.1 PROTO=TCP SPT=55103 DPT=80",
                offset_sec: -165
            },
            {
                source_type: "firewall",
                raw_message: "Sep 24 02:05:05 edge-fw01 kernel: [UFW BLOCK] IN=eth0 OUT= SRC=45.142.182.100 DST=10.0.0.1 PROTO=TCP SPT=55104 DPT=443",
                offset_sec: -160
            },
            {
                source_type: "firewall",
                raw_message: "Sep 24 02:05:06 edge-fw01 kernel: [UFW BLOCK] IN=eth0 OUT= SRC=45.142.182.100 DST=10.0.0.1 PROTO=TCP SPT=55105 DPT=3389",
                offset_sec: -155
            },

            // SCENARIO 3: Web SQL Injection Exploitation
            {
                source_type: "web_server",
                raw_message: "194.26.29.112 - - [24/Sep/2026:02:10:00 +0000] \"GET /products/view?id=101%20UNION%20SELECT%20null,username,password%20FROM%20users-- HTTP/1.1\" 403 1485",
                offset_sec: -120
            },

            // SCENARIO 4: Suspicious Login (3 Windows failed logins followed by successful login)
            {
                source_type: "windows_events",
                raw_message: "EventID 4625: An account failed to log on. Account Name: jdoe. Workstation Name: FINANCE-WK04. Source IP: 10.0.5.42",
                offset_sec: -100
            },
            {
                source_type: "windows_events",
                raw_message: "EventID 4625: An account failed to log on. Account Name: jdoe. Workstation Name: FINANCE-WK04. Source IP: 10.0.5.42",
                offset_sec: -80
            },
            {
                source_type: "windows_events",
                raw_message: "EventID 4625: An account failed to log on. Account Name: jdoe. Workstation Name: FINANCE-WK04. Source IP: 10.0.5.42",
                offset_sec: -60
            },
            {
                source_type: "windows_events",
                raw_message: "EventID 4624: An account was successfully logged on. Account Name: jdoe. Workstation Name: FINANCE-WK04. Source IP: 10.0.5.42",
                offset_sec: -40
            },

            // SCENARIO 5: Malware Execution Indicator (PowerShell Mimikatz command)
            {
                source_type: "windows_events",
                raw_message: "EventID 4688: A new process has been created. Process Name: powershell.exe. CommandLine: powershell -enc SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQAIABOAGUAdAAuAFcAZQBiAEMAbABpAGUAbgB0ACkALgBEAG8AdwBuAGwAbwBhAGQAUwB0AHIAaQBuAGcAKAA= mimikatz privilege::debug",
                offset_sec: -20
            },

            // SCENARIO 6: Anomalous Security Alert in Application Logs
            {
                source_type: "application",
                raw_message: "2026-09-24 02:15:30 [CRITICAL] [AUTH] Security anomaly detected: Abnormal session takeover pattern identified for account admin_ops from IP 198.51.100.89",
                offset_sec: -10
            },

            // BENIGN BACKGROUND TRAFFIC
            {
                source_type: "web_server",
                raw_message: "10.0.2.14 - - [24/Sep/2026:02:16:00 +0000] \"GET /dashboard HTTP/1.1\" 200 4821",
                offset_sec: -5
            },
            {
                source_type: "linux_ssh",
                raw_message: "Sep 24 02:16:10 srv-bastion sshd[14250]: Accepted publickey for devops from 10.0.1.12 port 52310 ssh2",
                offset_sec: -2
            }
        ];

        // Insert into raw_logs and normalized_logs
        let insertedLogs = 0;
        for (const item of rawTelemetry) {
            const eventTime = new Date(now + (item.offset_sec * 1000));
            const sourceId = sourceMap[item.source_type];

            // 1. Raw log
            const rawRes = await client.query(
                `
                INSERT INTO raw_logs
                    (source_id, timestamp, raw_message, source_type, hostname, ip_address, username, severity, metadata)
                VALUES
                    ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING id
                `,
                [
                    sourceId,
                    eventTime,
                    item.raw_message,
                    item.source_type,
                    null,
                    null,
                    null,
                    "info",
                    JSON.stringify({ ingested_by: "seed_script" })
                ]
            );
            const rawId = rawRes.rows[0].id;

            // 2. Normalization
            const normalized = normalizeLog({
                raw_message: item.raw_message,
                source_type: item.source_type,
                timestamp: eventTime
            }, {
                id: sourceId,
                source_type: item.source_type
            });

            // 3. Normalized log
            await client.query(
                `
                INSERT INTO normalized_logs
                (
                    source_id, event_time, event_type, severity,
                    source_ip, destination_ip, source_port, destination_port,
                    username, hostname, protocol, action, message, raw_log,
                    normalized_data, created_at
                )
                VALUES
                (
                    $1, $2, $3, $4,
                    $5, $6, $7, $8,
                    $9, $10, $11, $12, $13, $14,
                    $15, $16
                )
                `,
                [
                    sourceId,
                    eventTime,
                    normalized.event_type,
                    normalized.severity,
                    normalized.source_ip,
                    normalized.destination_ip,
                    normalized.source_port,
                    normalized.destination_port,
                    normalized.username,
                    normalized.hostname,
                    normalized.protocol,
                    normalized.action,
                    normalized.message,
                    item.raw_message,
                    JSON.stringify({ ...normalized.normalized_data, raw_log_id: rawId }),
                    eventTime
                ]
            );
            insertedLogs++;
        }
        console.log(`  -> Successfully ingested and normalized ${insertedLogs} log events.`);

        // 3. Execute Detection Engine
        console.log("[3/5] Executing SentinelX Detection Rules Engine...");
        const detectionResult = await executeDetectionEngine();
        console.log(`  -> Detection engine completed: ${detectionResult.detection_count} detections processed.`);

        // 4. Enrich Incident Timelines & Add Response Actions
        console.log("[4/5] Adding realistic analyst notes and simulated response actions...");
        const incidentsRes = await client.query("SELECT id, title, severity FROM incidents ORDER BY id DESC LIMIT 5");

        for (const inc of incidentsRes.rows) {
            // Add analyst timeline note
            await client.query(
                `
                INSERT INTO incident_timeline (incident_id, event_type, event_title, event_description, severity, status, event_time)
                VALUES ($1, 'investigation', 'Analyst Triaged Incident', 'Lead SOC Analyst reviewed telemetry, validated IoCs against threat intel, and initiated standard playbook.', $2, 'investigating', CURRENT_TIMESTAMP)
                `,
                [inc.id, inc.severity]
            );

            // Create response action if none exist
            const actionsRes = await client.query("SELECT id FROM response_actions WHERE incident_id = $1", [inc.id]);
            if (actionsRes.rows.length === 0) {
                const actionRes = await client.query(
                    `
                    INSERT INTO response_actions (incident_id, action_type, description, status, executed_at)
                    VALUES ($1, 'Block Source IP', 'Isolate attacker network access at perimeter firewall', 'completed', CURRENT_TIMESTAMP)
                    RETURNING id
                    `,
                    [inc.id]
                );
                // Record in timeline
                await client.query(
                    `
                    INSERT INTO incident_timeline (incident_id, event_type, event_title, event_description, severity, status, event_time)
                    VALUES ($1, 'response', 'Response Action Executed', 'Executed containment action: Block Source IP (Action ID ${actionRes.rows[0].id})', 'high', 'completed', CURRENT_TIMESTAMP)
                    `,
                    [inc.id]
                );
            }
        }

        // 5. Output Summary
        console.log("[5/5] Seed verification & summary:");
        const countsRes = await client.query(`
            SELECT
                (SELECT count(*) FROM raw_logs) AS raw_logs,
                (SELECT count(*) FROM normalized_logs) AS normalized_logs,
                (SELECT count(*) FROM alerts) AS alerts,
                (SELECT count(*) FROM incidents) AS incidents,
                (SELECT count(*) FROM threat_intelligence) AS threat_intel,
                (SELECT count(*) FROM mitre_attack) AS mitre_records,
                (SELECT count(*) FROM response_actions) AS response_actions
        `);
        const c = countsRes.rows[0];
        console.log(`
  +-----------------------+-------+
  | Entity                | Count |
  +-----------------------+-------+
  | Raw Logs              | ${String(c.raw_logs).padEnd(5)} |
  | Normalized Logs       | ${String(c.normalized_logs).padEnd(5)} |
  | Security Alerts       | ${String(c.alerts).padEnd(5)} |
  | Incidents             | ${String(c.incidents).padEnd(5)} |
  | Threat Intel Records  | ${String(c.threat_intel).padEnd(5)} |
  | MITRE ATT&CK Mappings | ${String(c.mitre_records).padEnd(5)} |
  | Response Actions      | ${String(c.response_actions).padEnd(5)} |
  +-----------------------+-------+
        `);

        console.log(">>> DATABASE SEEDING COMPLETED SUCCESSFULLY! <<<\n");
    } finally {
        client.release();
        await pool.end();
    }
}

seed().catch(err => {
    console.error("Seeding failed:", err);
    process.exit(1);
});
