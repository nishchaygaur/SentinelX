/**
 * SentinelX Threat Intelligence Service
 * Modular indicator evaluation for IPs, Domains, URLs, Hashes, and Usernames.
 * Fails gracefully and preserves alerts without crashing the pipeline.
 */

const pool = require("../config/db");

// Deterministic internal threat intelligence catalog
const KNOWN_THREAT_INDICATORS = {
    // Malicious or suspicious IP addresses (simulation / benchmark safe)
    ips: {
        "192.168.1.50": {
            threat_type: "brute_force_source",
            threat_name: "Internal Brute Force Scanner Node",
            source: "SentinelX Local Threat Feed",
            reputation: "suspicious",
            confidence: 90,
            description: "Observed conducting repeated automated authentication brute-force attempts."
        },
        "192.168.1.75": {
            threat_type: "port_scanner",
            threat_name: "Internal Network Reconnaissance Probe",
            source: "SentinelX Network Threat Feed",
            reputation: "suspicious",
            confidence: 88,
            description: "Host flagged for multi-port SYN scanning and service enumeration."
        },
        "198.51.100.25": {
            threat_type: "botnet_c2",
            threat_name: "Known C2 Command Node",
            source: "SentinelX Global Threat Feed",
            reputation: "malicious",
            confidence: 95,
            description: "Known active command and control node associated with automated attacks."
        },
        "203.0.113.50": {
            threat_type: "web_exploit_source",
            threat_name: "Web Application Attack Source",
            source: "SentinelX Web Defense Feed",
            reputation: "malicious",
            confidence: 92,
            description: "Repeated SQL injection and exploit payloads targeting public web servers."
        }
    },

    // Known malicious file hashes
    hashes: {
        "44d88612fea8a8f36de82e1278abb02f": {
            threat_type: "test_signature",
            threat_name: "EICAR Standard AV Test File",
            source: "SentinelX Static Hash DB",
            reputation: "malicious",
            confidence: 100,
            description: "Standard antivirus verification test file."
        },
        "275a021bbfb6489e54d471899f7db9d1663fc695ec2fe2a2c4538aabf651fd0f": {
            threat_type: "credential_dumper",
            threat_name: "Mimikatz Memory Dump Utility",
            source: "SentinelX Malware Hashes",
            reputation: "malicious",
            confidence: 98,
            description: "Known hash of credential dumping and memory manipulation tool."
        }
    },

    // Suspicious account targets
    usernames: {
        "root": {
            threat_type: "privileged_target",
            threat_name: "Superuser Privileged Account",
            source: "SentinelX Identity Intel",
            reputation: "suspicious",
            confidence: 75,
            description: "High-value administrative account targeted during credential attacks."
        },
        "administrator": {
            threat_type: "privileged_target",
            threat_name: "Windows Domain/Local Administrator",
            source: "SentinelX Identity Intel",
            reputation: "suspicious",
            confidence: 75,
            description: "Primary Windows administrative credential target."
        },
        "admin": {
            threat_type: "default_account",
            threat_name: "Generic Administrative Target",
            source: "SentinelX Identity Intel",
            reputation: "suspicious",
            confidence: 70,
            description: "Common default administrative identity scanned by automated botnets."
        }
    }
};

/**
 * Checks if an IP is in RFC1918 private range or loopback
 */
function isPrivateIp(ip) {
    if (!ip || typeof ip !== "string") return false;
    if (ip.startsWith("10.") || ip.startsWith("192.168.") || ip.startsWith("127.")) return true;
    if (ip.startsWith("172.")) {
        const parts = ip.split(".");
        const second = parseInt(parts[1], 10);
        if (second >= 16 && second <= 31) return true;
    }
    return false;
}

/**
 * Enriches indicators associated with an alert and stores in threat_intelligence table.
 *
 * @param {object} params
 * @param {number|string} params.alertId
 * @param {string} [params.ip]
 * @param {string} [params.hash]
 * @param {string} [params.username]
 * @param {string} [params.domain]
 * @param {string} [params.url]
 * @returns {Promise<Array>} List of inserted or matched threat intelligence records
 */
async function enrichAlertThreatIntel({ alertId, ip, hash, username, domain, url }) {
    const results = [];
    if (!alertId) return results;

    try {
        const indicatorsToEvaluate = [];

        if (ip) indicatorsToEvaluate.push({ type: "ip", value: String(ip).trim() });
        if (hash) indicatorsToEvaluate.push({ type: "hash", value: String(hash).trim() });
        if (username) indicatorsToEvaluate.push({ type: "username", value: String(username).trim() });
        if (domain) indicatorsToEvaluate.push({ type: "domain", value: String(domain).trim() });
        if (url) indicatorsToEvaluate.push({ type: "url", value: String(url).trim() });

        for (const ind of indicatorsToEvaluate) {
            let threatData = null;

            if (ind.type === "ip") {
                if (KNOWN_THREAT_INDICATORS.ips[ind.value]) {
                    threatData = KNOWN_THREAT_INDICATORS.ips[ind.value];
                } else if (!isPrivateIp(ind.value)) {
                    threatData = {
                        threat_type: "external_ip",
                        threat_name: "External Public Address",
                        source: "SentinelX IP Reputation Engine",
                        reputation: "external",
                        confidence: 60,
                        description: `External public IP ${ind.value} detected in security event.`
                    };
                } else {
                    threatData = {
                        threat_type: "internal_ip",
                        threat_name: "Internal Network Endpoint",
                        source: "SentinelX Asset Inventory",
                        reputation: "neutral",
                        confidence: 85,
                        description: `Internal RFC1918 private host IP ${ind.value}.`
                    };
                }
            } else if (ind.type === "hash" && KNOWN_THREAT_INDICATORS.hashes[ind.value]) {
                threatData = KNOWN_THREAT_INDICATORS.hashes[ind.value];
            } else if (ind.type === "username" && KNOWN_THREAT_INDICATORS.usernames[ind.value.toLowerCase()]) {
                threatData = KNOWN_THREAT_INDICATORS.usernames[ind.value.toLowerCase()];
            } else if (ind.type === "domain" || ind.type === "url") {
                threatData = {
                    threat_type: "network_indicator",
                    threat_name: `Network Indicator (${ind.type})`,
                    source: "SentinelX Threat Feeds",
                    reputation: "suspicious",
                    confidence: 70,
                    description: `Extracted ${ind.type} observed in attack telemetry.`
                };
            }

            if (threatData) {
                // Check if already recorded for this alert
                const existing = await pool.query(
                    `
                    SELECT id FROM threat_intelligence
                    WHERE alert_id = $1 AND indicator_type = $2 AND indicator_value = $3
                    LIMIT 1
                    `,
                    [alertId, ind.type, ind.value]
                );

                if (existing.rows.length === 0) {
                    const inserted = await pool.query(
                        `
                        INSERT INTO threat_intelligence
                        (
                            alert_id, indicator_type, indicator_value,
                            threat_type, threat_name, source,
                            reputation, confidence, description,
                            first_seen, last_seen, raw_data
                        )
                        VALUES
                        (
                            $1, $2, $3,
                            $4, $5, $6,
                            $7, $8, $9,
                            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $10
                        )
                        RETURNING *
                        `,
                        [
                            alertId,
                            ind.type,
                            ind.value,
                            threatData.threat_type,
                            threatData.threat_name,
                            threatData.source,
                            threatData.reputation,
                            threatData.confidence,
                            threatData.description,
                            JSON.stringify(threatData)
                        ]
                    );
                    results.push(inserted.rows[0]);
                } else {
                    results.push(existing.rows[0]);
                }
            }
        }
    } catch (err) {
        console.error("Threat intelligence enrichment warning:", err.message);
        // Never throw: preserve alert and pipeline
    }

    return results;
}

module.exports = {
    enrichAlertThreatIntel,
    KNOWN_THREAT_INDICATORS,
    isPrivateIp
};
