/**
 * SentinelX Detection Rules Engine
 * Implements deterministic, explainable security detection algorithms for:
 * 1. Brute Force Detection
 * 2. Port Scan Detection
 * 3. SQL Injection Detection
 * 4. Suspicious Login Detection
 * 5. Malware Indicator Detection
 * 6. Anomalous Activity Detection
 */

const pool = require("../config/db");
const config = require("../config/detectionConfig");
const { calculateRiskScore } = require("../services/riskScoringService");
const { enrichAlertThreatIntel } = require("../services/threatIntelService");
const { mapAlertToMitre } = require("../services/mitreService");
const { createIncidentForAlert } = require("../controllers/incidentController");

/**
 * 1. Brute Force Detection
 * Evaluates logs for repeated authentication failures within the configured time window.
 */
async function detectBruteForce(logs) {
    const detections = [];
    const windowMs = config.bruteForce.timeWindowMinutes * 60 * 1000;
    const threshold = config.bruteForce.failedLoginsThreshold;

    // Filter failed login events
    const failedLogins = logs.filter(log =>
        log.event_type === "failed_login" ||
        log.event_type === "brute_force" ||
        log.action === "failed_login" ||
        log.action === "invalid_user"
    );

    // Group by source IP and username
    const groups = {};
    for (const log of failedLogins) {
        const key = `${log.source_ip || "unknown"}|${log.username || "unknown"}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(log);
    }

    for (const [key, groupLogs] of Object.entries(groups)) {
        if (groupLogs.length < threshold) continue;

        // Sort by event time
        groupLogs.sort((a, b) => new Date(a.event_time) - new Date(b.event_time));
        const firstAttempt = new Date(groupLogs[0].event_time);
        const lastAttempt = new Date(groupLogs[groupLogs.length - 1].event_time);

        if (!isNaN(firstAttempt.getTime()) && !isNaN(lastAttempt.getTime())) {
            const timeSpan = lastAttempt.getTime() - firstAttempt.getTime();
            if (timeSpan > windowMs) {
                const windowLogs = groupLogs.filter(l => (lastAttempt.getTime() - new Date(l.event_time).getTime()) <= windowMs);
                if (windowLogs.length < threshold) continue;
            }
        }

        const [sourceIp, username] = key.split("|");
        const attemptCount = groupLogs.length;
        const severity = attemptCount >= config.bruteForce.criticalThreshold ? "critical" : "high";
        const confidence = Math.min(0.98, 0.85 + (attemptCount * 0.01));

        const representativeLog = groupLogs[groupLogs.length - 1];

        detections.push({
            rule: "BRUTE_FORCE_FAILED_LOGIN",
            alert_type: "brute_force",
            severity,
            confidence,
            title: `Potential Brute Force Attack: ${sourceIp} (${attemptCount} attempts)`,
            description: `Failed login threshold exceeded: ${attemptCount} authentication failures detected from ${sourceIp} targeting user '${username}'.`,
            source_log_id: representativeLog.id,
            source_ip: sourceIp !== "unknown" ? sourceIp : null,
            username: username !== "unknown" ? username : null,
            technique_id: "T1110",
            metadata: {
                attempt_count: attemptCount,
                threshold,
                time_window_minutes: config.bruteForce.timeWindowMinutes,
                first_attempt: isNaN(firstAttempt.getTime()) ? null : firstAttempt.toISOString(),
                last_attempt: isNaN(lastAttempt.getTime()) ? null : lastAttempt.toISOString(),
                source_ip: sourceIp,
                username: username
            }
        });
    }

    return detections;
}

/**
 * 2. Port Scan Detection
 * Detects connections to multiple distinct destination ports from the same source IP.
 */
async function detectPortScan(logs) {
    const detections = [];
    const threshold = config.portScan.uniquePortsThreshold;

    // Filter connection logs with source IP and destination port
    const connections = logs.filter(log =>
        log.source_ip &&
        (log.destination_port || log.event_type === "port_scan" || log.event_type === "network_scan")
    );

    const groups = {};
    for (const log of connections) {
        const ip = String(log.source_ip);
        if (!groups[ip]) groups[ip] = [];
        groups[ip].push(log);
    }

    for (const [sourceIp, groupLogs] of Object.entries(groups)) {
        const uniquePorts = new Set(
            groupLogs.map(l => l.destination_port).filter(p => p !== null && p !== undefined)
        );

        const hasScanFlag = groupLogs.some(l => l.event_type === "port_scan" || l.event_type === "network_scan");

        if (uniquePorts.size >= threshold || (hasScanFlag && uniquePorts.size >= 1)) {
            const portsList = Array.from(uniquePorts).sort((a, b) => a - b);
            const dstIp = groupLogs.find(l => l.destination_ip)?.destination_ip || "monitored-network";
            const severity = uniquePorts.size >= config.portScan.criticalThreshold ? "critical" : "high";
            const confidence = Math.min(0.98, 0.82 + (uniquePorts.size * 0.02));
            const representativeLog = groupLogs[groupLogs.length - 1];

            detections.push({
                rule: "PORT_SCAN_DETECTED",
                alert_type: "port_scan",
                severity,
                confidence,
                title: `Potential Port Scan Detected (${uniquePorts.size} ports)`,
                description: `Network scanning activity detected from ${sourceIp} probing ${uniquePorts.size} unique ports on ${dstIp} (ports: ${portsList.slice(0, 8).join(", ")}${portsList.length > 8 ? "..." : ""}).`,
                source_log_id: representativeLog.id,
                source_ip: sourceIp,
                destination_ip: dstIp !== "monitored-network" ? dstIp : null,
                technique_id: "T1046",
                metadata: {
                    source_ip: sourceIp,
                    destination_ip: dstIp,
                    unique_ports: portsList,
                    port_count: uniquePorts.size,
                    threshold,
                    connection_count: groupLogs.length
                }
            });
        }
    }

    return detections;
}

/**
 * 3. SQL Injection Detection
 * Scans normalized logs for SQL injection indicators using controlled pattern engine.
 */
async function detectSqlInjection(logs) {
    const detections = [];
    const patterns = config.sqlInjection.patterns;

    for (const log of logs) {
        const textToScan = `${log.message || ""} ${log.raw_log || ""}`;
        let matchedPattern = null;

        for (const pattern of patterns) {
            if (pattern.test(textToScan)) {
                matchedPattern = pattern.toString();
                break;
            }
        }

        const isExplicitSqlEvent = log.event_type === "sql_injection";

        if (matchedPattern || isExplicitSqlEvent) {
            detections.push({
                rule: "SQL_INJECTION_DETECTED",
                alert_type: "sql_injection",
                severity: "critical",
                confidence: 0.95,
                title: "Potential SQL Injection Attack",
                description: `SQL injection pattern detected in payload from ${log.source_ip || "remote source"}. Matched syntax indicator.`,
                source_log_id: log.id,
                source_ip: log.source_ip,
                destination_ip: log.destination_ip,
                technique_id: "T1190",
                metadata: {
                    matched_pattern: matchedPattern,
                    source_ip: log.source_ip,
                    destination_ip: log.destination_ip,
                    payload_snippet: textToScan.slice(0, 150)
                }
            });
        }
    }

    return detections;
}

/**
 * 4. Suspicious Login Detection
 * Detects:
 * - Failed login followed by successful login from the same user/IP within window (Brute force success)
 * - Privileged account login from external / unusual IP
 */
async function detectSuspiciousLogin(logs) {
    const detections = [];
    const windowMs = config.suspiciousLogin.failureToSuccessWindowMinutes * 60 * 1000;
    const privilegedAccounts = new Set(config.suspiciousLogin.privilegedAccounts.map(a => a.toLowerCase()));

    // Chronologically sort
    const sorted = [...logs].sort((a, b) => new Date(a.event_time) - new Date(b.event_time));

    for (let i = 0; i < sorted.length; i++) {
        const current = sorted[i];

        // Case 1: Check for successful login
        const isSuccess = current.event_type === "login" || current.action === "successful_login" || current.action === "allow";
        if (isSuccess && current.username) {
            const userLower = current.username.toLowerCase();

            // Look back for preceding failed attempts within window
            const currentTime = new Date(current.event_time).getTime();
            const failures = sorted.slice(0, i).filter(prev => {
                const prevTime = new Date(prev.event_time).getTime();
                const isWithinWindow = (currentTime - prevTime) <= windowMs && (currentTime - prevTime) >= 0;
                const isSameUserOrIp = (prev.username && prev.username.toLowerCase() === userLower) ||
                                       (prev.source_ip && current.source_ip && prev.source_ip === current.source_ip);
                const isFailed = prev.event_type === "failed_login" || prev.action === "failed_login";
                return isWithinWindow && isSameUserOrIp && isFailed;
            });

            if (failures.length >= config.suspiciousLogin.failedAttemptsBeforeSuccessThreshold) {
                detections.push({
                    rule: "SUSPICIOUS_LOGIN_DETECTED",
                    alert_type: "suspicious_login",
                    severity: "high",
                    confidence: 0.88,
                    title: `Suspicious Login: Success After ${failures.length} Failures`,
                    description: `User '${current.username}' successfully authenticated after ${failures.length} prior failure attempts from ${current.source_ip || "source"}.`,
                    source_log_id: current.id,
                    source_ip: current.source_ip,
                    username: current.username,
                    technique_id: "T1078",
                    metadata: {
                        prior_failures_count: failures.length,
                        source_ip: current.source_ip,
                        username: current.username,
                        success_time: current.event_time
                    }
                });
                continue;
            }

            // Case 2: Privileged account login
            if (privilegedAccounts.has(userLower) && current.action === "suspicious") {
                detections.push({
                    rule: "SUSPICIOUS_LOGIN_DETECTED",
                    alert_type: "suspicious_login",
                    severity: "high",
                    confidence: 0.85,
                    title: `Suspicious Privileged Account Access (${current.username})`,
                    description: `Privileged account '${current.username}' authenticated from suspicious endpoint ${current.source_ip || "unknown"}.`,
                    source_log_id: current.id,
                    source_ip: current.source_ip,
                    username: current.username,
                    technique_id: "T1078",
                    metadata: {
                        privileged_account: current.username,
                        source_ip: current.source_ip
                    }
                });
            }
        }
        // Explicit suspicious login flag
        else if (current.event_type === "suspicious_login" || current.action === "suspicious") {
            detections.push({
                rule: "SUSPICIOUS_LOGIN_DETECTED",
                alert_type: "suspicious_login",
                severity: "high",
                confidence: 0.85,
                title: "Suspicious Login Activity Detected",
                description: `Suspicious authentication activity detected for ${current.username || "unknown user"} from ${current.source_ip || "unknown IP"}.`,
                source_log_id: current.id,
                source_ip: current.source_ip,
                username: current.username,
                technique_id: "T1078",
                metadata: {
                    source_ip: current.source_ip,
                    username: current.username
                }
            });
        }
    }

    return detections;
}

/**
 * 5. Malware Indicator Detection
 * Checks for static indicators: tool names, extensions, suspicious commands, test hashes.
 */
async function detectMalwareIndicators(logs) {
    const detections = [];
    const cfg = config.malwareIndicator;

    for (const log of logs) {
        const text = `${log.message || ""} ${log.raw_log || ""} ${log.hostname || ""}`.toLowerCase();
        let matchedIndicator = null;
        let indicatorType = null;

        // Check suspicious file names
        for (const file of cfg.suspiciousFiles) {
            if (text.includes(file.toLowerCase())) {
                matchedIndicator = file;
                indicatorType = "suspicious_file";
                break;
            }
        }

        // Check suspicious extensions
        if (!matchedIndicator) {
            for (const ext of cfg.suspiciousExtensions) {
                if (text.includes(ext.toLowerCase())) {
                    matchedIndicator = ext;
                    indicatorType = "ransomware_extension";
                    break;
                }
            }
        }

        // Check suspicious commands
        if (!matchedIndicator) {
            for (const cmd of cfg.suspiciousCommands) {
                if (text.includes(cmd.toLowerCase())) {
                    matchedIndicator = cmd;
                    indicatorType = "suspicious_command";
                    break;
                }
            }
        }

        // Check explicit event type
        const isExplicit = log.event_type === "malware_indicator" || log.action === "malware_alert";

        if (matchedIndicator || isExplicit) {
            const detectedItem = matchedIndicator || "Known malicious artifact pattern";
            detections.push({
                rule: "MALWARE_INDICATOR_DETECTED",
                alert_type: "malware_indicator",
                severity: "critical",
                confidence: 0.95,
                title: `Potential Malware Indicator Detected (${detectedItem})`,
                description: `Potential malware activity or malicious execution detected on ${log.hostname || "monitored host"}: '${detectedItem}'.`,
                source_log_id: log.id,
                source_ip: log.source_ip,
                hostname: log.hostname,
                technique_id: "T1204",
                metadata: {
                    indicator: detectedItem,
                    indicator_type: indicatorType || "static_pattern",
                    hostname: log.hostname,
                    source_ip: log.source_ip
                }
            });
        }
    }

    return detections;
}

/**
 * 6. Anomalous Activity Detection
 * Statistical and explainable anomaly detection for event surges and defense evasion spikes.
 */
async function detectAnomalousActivity(logs) {
    const detections = [];

    // Check individual explicit anomaly logs
    for (const log of logs) {
        if (log.event_type === "anomalous_activity" || log.event_type === "security_anomaly" || (log.severity === "critical" && log.action === "anomalous")) {
            detections.push({
                rule: "ANOMALOUS_ACTIVITY_DETECTED",
                alert_type: "anomalous_activity",
                severity: "high",
                confidence: 0.82,
                title: "Anomalous Activity Spike Detected",
                description: `Anomalous activity detected from ${log.source_ip || "source"} on ${log.hostname || "target system"}: ${log.message || "abnormal frequency observed"}.`,
                source_log_id: log.id,
                source_ip: log.source_ip,
                hostname: log.hostname,
                technique_id: "T1070",
                metadata: {
                    source_ip: log.source_ip,
                    hostname: log.hostname,
                    reason: "Explicit anomalous event signature or critical anomaly action"
                }
            });
        }
    }

    // Statistical volume spike analysis across the dataset
    if (logs.length >= config.anomalousActivity.minEventsForAnomaly) {
        const errorLogs = logs.filter(l => l.severity === "high" || l.severity === "critical");
        const errorRatio = errorLogs.length / logs.length;

        // If high/critical error ratio is unusually high (> 40% of all events)
        if (errorRatio >= 0.40 && errorLogs.length >= 8) {
            const representativeLog = errorLogs[errorLogs.length - 1];
            detections.push({
                rule: "ANOMALOUS_ACTIVITY_DETECTED",
                alert_type: "anomalous_activity",
                severity: "high",
                confidence: 0.85,
                title: `Statistical Anomaly: Security Event Spike (${(errorRatio * 100).toFixed(0)}% high-severity ratio)`,
                description: `Explainable anomaly: Observed abnormal concentration of high-severity events (${errorLogs.length} of ${logs.length} events), exceeding normal operational baseline multiplier.`,
                source_log_id: representativeLog.id,
                source_ip: representativeLog.source_ip,
                hostname: representativeLog.hostname,
                technique_id: "T1070",
                metadata: {
                    total_events: logs.length,
                    error_events: errorLogs.length,
                    error_ratio: errorRatio,
                    reason: "Abnormal surge in high-severity telemetry ratio"
                }
            });
        }
    }

    return detections;
}

/**
 * Executes the complete detection engine across all normalized logs,
 * computes risk scores, enriches threat intel, maps MITRE ATT&CK,
 * creates alerts, and correlates incidents.
 */
async function executeDetectionEngine() {
    const logsResult = await pool.query(`
        SELECT
            id, event_time, event_type, severity,
            source_ip, destination_ip, source_port, destination_port,
            username, hostname, protocol, action,
            message, raw_log, normalized_data
        FROM normalized_logs
        ORDER BY id ASC
    `);

    const logs = logsResult.rows;

    const [
        bruteForceDetections,
        portScanDetections,
        sqlInjectionDetections,
        suspiciousLoginDetections,
        malwareDetections,
        anomalousDetections
    ] = await Promise.all([
        detectBruteForce(logs),
        detectPortScan(logs),
        detectSqlInjection(logs),
        detectSuspiciousLogin(logs),
        detectMalwareIndicators(logs),
        detectAnomalousActivity(logs)
    ]);

    const allDetections = [
        ...bruteForceDetections,
        ...portScanDetections,
        ...sqlInjectionDetections,
        ...suspiciousLoginDetections,
        ...malwareDetections,
        ...anomalousDetections
    ];

    const processedAlerts = [];

    for (const det of allDetections) {
        // Calculate transparent risk score
        const riskResult = calculateRiskScore({
            severity: det.severity,
            confidence: det.confidence,
            threatIntelReputation: det.source_ip ? "suspicious" : null,
            occurrenceCount: det.metadata?.attempt_count || det.metadata?.port_count || 1,
            techniqueId: det.technique_id
        });
        det.risk_score = riskResult.score;
        det.risk_reasons = riskResult.reasons;

        // Check for existing alert
        const existingAlert = await pool.query(
            `
            SELECT id FROM alerts
            WHERE detection_rule = $1
              AND (log_id = $2 OR (title = $3 AND description = $4 AND detected_at > CURRENT_TIMESTAMP - INTERVAL '1 hour'))
            LIMIT 1
            `,
            [det.rule, det.source_log_id, det.title, det.description]
        );

        let alertId;
        let alertStatus;

        if (existingAlert.rows.length > 0) {
            alertId = existingAlert.rows[0].id;
            alertStatus = "already_detected";
        } else {
            const insertResult = await pool.query(
                `
                INSERT INTO alerts
                (
                    log_id, alert_type, severity,
                    title, description, detection_rule,
                    status, risk_score, detected_at, created_at
                )
                VALUES
                (
                    $1, $2, $3,
                    $4, $5, $6,
                    'new', $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                )
                RETURNING id
                `,
                [
                    det.source_log_id,
                    det.alert_type,
                    det.severity,
                    det.title,
                    det.description,
                    det.rule,
                    det.risk_score
                ]
            );
            alertId = insertResult.rows[0].id;
            alertStatus = "detected";
        }

        // 1. MITRE ATT&CK Mapping
        await mapAlertToMitre(alertId, det.rule);

        // 2. Threat Intelligence Enrichment
        await enrichAlertThreatIntel({
            alertId,
            ip: det.source_ip,
            username: det.username
        });

        // 3. Incident Correlation & Creation
        const incidentResult = await createIncidentForAlert({
            id: alertId,
            alert_type: det.alert_type,
            severity: det.severity,
            title: det.title,
            description: det.description,
            detection_rule: det.rule,
            risk_score: det.risk_score
        });

        processedAlerts.push({
            alert_id: alertId,
            detection_rule: det.rule,
            severity: det.severity,
            risk_score: det.risk_score,
            status: alertStatus,
            incident: incidentResult
        });
    }

    return {
        detection_count: allDetections.length,
        processed_alerts: processedAlerts
    };
}

module.exports = {
    detectBruteForce,
    detectPortScan,
    detectSqlInjection,
    detectSuspiciousLogin,
    detectMalwareIndicators,
    detectAnomalousActivity,
    executeDetectionEngine
};
