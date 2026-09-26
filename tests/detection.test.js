/**
 * SentinelX Detection Rules Test Suite
 * Tests positive and negative cases for all 6 detection engines:
 * 1. Brute Force (Positive & Negative)
 * 2. Port Scan (Positive & Negative)
 * 3. SQL Injection (Positive & Negative)
 * 4. Suspicious Login (Positive & Negative)
 * 5. Malware Indicator (Positive & Negative)
 * 6. Anomalous Activity (Positive & Negative)
 */

const assert = require("assert");
const {
    detectBruteForce,
    detectPortScan,
    detectSqlInjection,
    detectSuspiciousLogin,
    detectMalwareIndicators,
    detectAnomalousActivity
} = require("../backend/src/detection/detectionRules");

async function runDetectionTests() {
    console.log("\n==================================================");
    console.log("    SENTINELX DETECTION ENGINE UNIT TESTS");
    console.log("==================================================\n");

    let passed = 0;
    let failed = 0;

    async function asyncTest(name, fn) {
        try {
            await fn();
            console.log(`  [PASS] ${name}`);
            passed++;
        } catch (err) {
            console.error(`  [FAIL] ${name}: ${err.message}`);
            failed++;
        }
    }

    const now = new Date();

    // ----------------------------------------------------
    // 1. BRUTE FORCE TESTS
    // ----------------------------------------------------
    await asyncTest("Brute Force Detection - POSITIVE (5+ failed logins trigger alert)", async () => {
        const logs = [1, 2, 3, 4, 5, 6].map((i) => ({
            id: i,
            event_time: new Date(now.getTime() - (6 - i) * 10000).toISOString(),
            event_type: "failed_login",
            action: "failed_login",
            source_ip: "192.168.1.50",
            username: "admin"
        }));

        const detections = await detectBruteForce(logs);
        assert.ok(detections.length >= 1, "Expected at least 1 brute force detection");
        assert.strictEqual(detections[0].rule, "BRUTE_FORCE_FAILED_LOGIN");
        assert.strictEqual(detections[0].alert_type, "brute_force");
        assert.strictEqual(detections[0].metadata.attempt_count, 6);
        assert.strictEqual(detections[0].technique_id, "T1110");
    });

    await asyncTest("Brute Force Detection - NEGATIVE (Below threshold of 5 does not trigger)", async () => {
        const logs = [1, 2].map((i) => ({
            id: i,
            event_time: new Date(now.getTime() - (3 - i) * 10000).toISOString(),
            event_type: "failed_login",
            action: "failed_login",
            source_ip: "192.168.1.99",
            username: "jdoe"
        }));

        const detections = await detectBruteForce(logs);
        assert.strictEqual(detections.length, 0, "Expected 0 detections when below threshold");
    });

    // ----------------------------------------------------
    // 2. PORT SCAN TESTS
    // ----------------------------------------------------
    await asyncTest("Port Scan Detection - POSITIVE (5+ unique ports trigger alert)", async () => {
        const ports = [21, 22, 80, 443, 3389, 8080];
        const logs = ports.map((port, i) => ({
            id: 10 + i,
            event_time: new Date(now.getTime() - (ports.length - i) * 5000).toISOString(),
            event_type: "network_traffic",
            source_ip: "192.168.1.75",
            destination_ip: "10.0.0.5",
            destination_port: port
        }));

        const detections = await detectPortScan(logs);
        assert.ok(detections.length >= 1, "Expected at least 1 port scan detection");
        assert.strictEqual(detections[0].rule, "PORT_SCAN_DETECTED");
        assert.strictEqual(detections[0].technique_id, "T1046");
        assert.ok(detections[0].metadata.port_count >= 5);
    });

    await asyncTest("Port Scan Detection - NEGATIVE (Repeated traffic to same port does not trigger)", async () => {
        const logs = [1, 2, 3, 4, 5].map((i) => ({
            id: 20 + i,
            event_time: new Date(now.getTime() - i * 1000).toISOString(),
            event_type: "network_traffic",
            source_ip: "192.168.1.200",
            destination_ip: "10.0.0.5",
            destination_port: 443 // Same port
        }));

        const detections = await detectPortScan(logs);
        assert.strictEqual(detections.length, 0, "Expected 0 detections for single port traffic");
    });

    // ----------------------------------------------------
    // 3. SQL INJECTION TESTS
    // ----------------------------------------------------
    await asyncTest("SQL Injection Detection - POSITIVE (UNION SELECT payload triggers alert)", async () => {
        const logs = [
            {
                id: 30,
                event_time: now.toISOString(),
                event_type: "http_request",
                source_ip: "203.0.113.50",
                destination_ip: "10.0.0.5",
                message: "GET /api/users?id=1 UNION SELECT username,password FROM users-- HTTP/1.1",
                raw_log: "GET /api/users?id=1 UNION SELECT username,password FROM users-- HTTP/1.1"
            }
        ];

        const detections = await detectSqlInjection(logs);
        assert.strictEqual(detections.length, 1);
        assert.strictEqual(detections[0].rule, "SQL_INJECTION_DETECTED");
        assert.strictEqual(detections[0].severity, "critical");
        assert.strictEqual(detections[0].technique_id, "T1190");
    });

    await asyncTest("SQL Injection Detection - NEGATIVE (Normal HTTP request does not trigger)", async () => {
        const logs = [
            {
                id: 31,
                event_time: now.toISOString(),
                event_type: "http_request",
                source_ip: "192.168.1.10",
                destination_ip: "10.0.0.5",
                message: "GET /products?category=books&sort=price_asc HTTP/1.1",
                raw_log: "GET /products?category=books&sort=price_asc HTTP/1.1"
            }
        ];

        const detections = await detectSqlInjection(logs);
        assert.strictEqual(detections.length, 0, "Expected 0 detections for benign web request");
    });

    // ----------------------------------------------------
    // 4. SUSPICIOUS LOGIN TESTS
    // ----------------------------------------------------
    await asyncTest("Suspicious Login Detection - POSITIVE (Failed attempts followed by success triggers alert)", async () => {
        const logs = [
            {
                id: 40,
                event_time: new Date(now.getTime() - 60000).toISOString(),
                event_type: "failed_login",
                action: "failed_login",
                source_ip: "198.51.100.25",
                username: "analyst1"
            },
            {
                id: 41,
                event_time: new Date(now.getTime() - 40000).toISOString(),
                event_type: "failed_login",
                action: "failed_login",
                source_ip: "198.51.100.25",
                username: "analyst1"
            },
            {
                id: 42,
                event_time: new Date(now.getTime() - 10000).toISOString(),
                event_type: "login",
                action: "successful_login",
                source_ip: "198.51.100.25",
                username: "analyst1"
            }
        ];

        const detections = await detectSuspiciousLogin(logs);
        assert.ok(detections.length >= 1, "Expected suspicious login detection");
        assert.strictEqual(detections[0].rule, "SUSPICIOUS_LOGIN_DETECTED");
        assert.strictEqual(detections[0].technique_id, "T1078");
    });

    await asyncTest("Suspicious Login Detection - NEGATIVE (Normal successful login without prior failures does not trigger)", async () => {
        const logs = [
            {
                id: 43,
                event_time: now.toISOString(),
                event_type: "login",
                action: "successful_login",
                source_ip: "192.168.1.15",
                username: "analyst2"
            }
        ];

        const detections = await detectSuspiciousLogin(logs);
        assert.strictEqual(detections.length, 0, "Expected 0 detections for normal routine login");
    });

    // ----------------------------------------------------
    // 5. MALWARE INDICATOR TESTS
    // ----------------------------------------------------
    await asyncTest("Malware Indicator Detection - POSITIVE (Known tool mimikatz / powershell -enc triggers alert)", async () => {
        const logs = [
            {
                id: 50,
                event_time: now.toISOString(),
                event_type: "process_creation",
                hostname: "FINANCE-PC01",
                source_ip: "192.168.1.105",
                message: "Process mimikatz.exe executed with command line: mimikatz.exe \"privilege::debug\" \"sekurlsa::logonpasswords\"",
                raw_log: "New process: mimikatz.exe created by user SYSTEM"
            }
        ];

        const detections = await detectMalwareIndicators(logs);
        assert.strictEqual(detections.length, 1);
        assert.strictEqual(detections[0].rule, "MALWARE_INDICATOR_DETECTED");
        assert.strictEqual(detections[0].severity, "critical");
        assert.strictEqual(detections[0].technique_id, "T1204");
    });

    await asyncTest("Malware Indicator Detection - NEGATIVE (Standard process execution does not trigger)", async () => {
        const logs = [
            {
                id: 51,
                event_time: now.toISOString(),
                event_type: "process_creation",
                hostname: "HR-PC02",
                source_ip: "192.168.1.110",
                message: "Process C:\\Windows\\System32\\calc.exe executed by user jdoe",
                raw_log: "Process calc.exe started"
            }
        ];

        const detections = await detectMalwareIndicators(logs);
        assert.strictEqual(detections.length, 0, "Expected 0 detections for benign process execution");
    });

    // ----------------------------------------------------
    // 6. ANOMALOUS ACTIVITY TESTS
    // ----------------------------------------------------
    await asyncTest("Anomalous Activity Detection - POSITIVE (Explicit critical anomaly event triggers alert)", async () => {
        const logs = [
            {
                id: 60,
                event_time: now.toISOString(),
                event_type: "anomalous_activity",
                severity: "critical",
                action: "anomalous",
                hostname: "DC-01",
                source_ip: "192.168.1.250",
                message: "Security log cleared: Event log clearing activity detected on domain controller."
            }
        ];

        const detections = await detectAnomalousActivity(logs);
        assert.ok(detections.length >= 1, "Expected anomalous activity detection");
        assert.strictEqual(detections[0].rule, "ANOMALOUS_ACTIVITY_DETECTED");
        assert.strictEqual(detections[0].technique_id, "T1070");
    });

    await asyncTest("Anomalous Activity Detection - NEGATIVE (Standard benign event does not trigger anomaly)", async () => {
        const logs = [
            {
                id: 61,
                event_time: now.toISOString(),
                event_type: "windows_event",
                severity: "low",
                action: "info",
                hostname: "DESKTOP-01",
                source_ip: "192.168.1.12",
                message: "Service running normally without errors."
            }
        ];

        const detections = await detectAnomalousActivity(logs);
        assert.strictEqual(detections.length, 0, "Expected 0 detections for standard low severity event");
    });

    console.log(`\nDetection Tests Summary: ${passed} passed, ${failed} failed.\n`);
    if (failed > 0) {
        process.exit(1);
    }
}

if (require.main === module) {
    runDetectionTests();
}

module.exports = { runDetectionTests };
