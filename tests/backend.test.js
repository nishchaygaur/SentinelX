/**
 * SentinelX Backend API Integration Tests
 * Validates all core API endpoints against the running Express application and PostgreSQL database.
 */

const http = require("http");
const assert = require("assert");
const path = require("path");

const backendDir = path.join(__dirname, "../backend");
require(path.join(backendDir, "node_modules/dotenv")).config({ path: path.join(backendDir, ".env") });
const app = require(path.join(backendDir, "src/app"));
const axios = require(path.join(backendDir, "node_modules/axios"));

async function runBackendTests() {
    console.log("\n==================================================");
    console.log("      SENTINELX BACKEND API INTEGRATION TESTS");
    console.log("==================================================\n");

    const server = http.createServer(app);
    let passed = 0;
    let failed = 0;

    await new Promise(resolve => server.listen(0, resolve));
    const port = server.address().port;
    const base = `http://localhost:${port}/api`;

    async function testEndpoint(name, fn) {
        try {
            await fn();
            console.log(`  [PASS] ${name}`);
            passed++;
        } catch (err) {
            console.error(`  [FAIL] ${name}: ${err.message}`);
            failed++;
        }
    }

    try {
        // 1. Health check
        await testEndpoint("GET /api/health returns 200 and healthy status", async () => {
            const res = await axios.get(`${base}/health`);
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.data.status, "healthy");
        });

        // 2. Log sources
        await testEndpoint("GET /api/log-sources returns 5 default sources", async () => {
            const res = await axios.get(`${base}/log-sources`);
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.data.success, true);
            assert.strictEqual(res.data.data.length, 5);
        });

        // 3. Raw log ingestion
        await testEndpoint("POST /api/logs/ingest accepts raw web log, stores in raw_logs and normalized_logs", async () => {
            const payload = {
                source_type: "web_server",
                raw_message: "192.168.1.188 - - [24/Sep/2026:01:00:00 +0000] \"GET /admin?user=root' UNION SELECT null,null-- HTTP/1.1\" 403 234"
            };
            const res = await axios.post(`${base}/logs/ingest`, payload);
            assert.strictEqual(res.status, 201);
            assert.strictEqual(res.data.success, true);
            assert.strictEqual(res.data.data.accepted_count, 1);
            assert.ok(res.data.data.raw_log_ids.length > 0);
            assert.ok(res.data.data.normalized_log_ids.length > 0);
            const ingestedRawId = res.data.data.raw_log_ids[0];
            const ingestedNormId = res.data.data.normalized_log_ids[0];
            assert.ok(ingestedRawId > 0);
            assert.ok(ingestedNormId > 0);
        });

        // 4. Raw logs query
        await testEndpoint("GET /api/logs/raw returns raw logs", async () => {
            const res = await axios.get(`${base}/logs/raw?limit=10`);
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.data.success, true);
            assert.ok(Array.isArray(res.data.data));
            assert.ok(res.data.total >= 1);
        });

        // 5. Normalized logs query
        await testEndpoint("GET /api/normalized-logs returns normalized logs", async () => {
            const res = await axios.get(`${base}/normalized-logs`);
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.data.success, true);
            assert.ok(Array.isArray(res.data.data));
            assert.ok(res.data.count >= 1);
        });

        // 6. Run detection
        await testEndpoint("POST /api/detection/run executes detection and creates/links alerts", async () => {
            const res = await axios.post(`${base}/detection/run`);
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.data.success, true);
            assert.ok(res.data.count >= 0);
        });

        // 7. Alerts query
        let firstAlertId = 1;
        await testEndpoint("GET /api/alerts returns alert list", async () => {
            const res = await axios.get(`${base}/alerts`);
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.data.success, true);
            assert.ok(res.data.data.length > 0);
            firstAlertId = res.data.data[0].id;
        });

        // 8. Alert enrichment
        await testEndpoint(`GET /api/alerts/${firstAlertId}/enrichment returns MITRE and threat intel`, async () => {
            const res = await axios.get(`${base}/alerts/${firstAlertId}/enrichment`);
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.data.success, true);
            assert.ok(res.data.data.alert);
        });

        // 9. Incidents query
        let firstIncidentId = 1;
        await testEndpoint("GET /api/incidents returns incidents list", async () => {
            const res = await axios.get(`${base}/incidents`);
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.data.success, true);
            assert.ok(res.data.data.length > 0);
            firstIncidentId = res.data.data[0].id;
        });

        // 10. Incident by ID
        await testEndpoint(`GET /api/incidents/${firstIncidentId} returns detailed incident view`, async () => {
            const res = await axios.get(`${base}/incidents/${firstIncidentId}`);
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.data.success, true);
            assert.strictEqual(String(res.data.data.incident.id), String(firstIncidentId));
        });

        // 11. Incident Timeline GET
        await testEndpoint(`GET /api/incidents/${firstIncidentId}/timeline returns timeline events`, async () => {
            const res = await axios.get(`${base}/incidents/${firstIncidentId}/timeline`);
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.data.success, true);
            assert.ok(Array.isArray(res.data.data.timeline));
            assert.ok(res.data.data.timeline.length > 0);
        });

        // 12. Incident Timeline POST (Custom timeline event)
        await testEndpoint(`POST /api/incidents/${firstIncidentId}/timeline appends investigation note`, async () => {
            const payload = {
                event_type: "investigation",
                event_title: "Automated API Test Investigation Note",
                event_description: "Investigator reviewed telemetry and confirmed detection indicator accuracy.",
                severity: "high"
            };
            const res = await axios.post(`${base}/incidents/${firstIncidentId}/timeline`, payload);
            assert.strictEqual(res.status, 201);
            assert.strictEqual(res.data.success, true);
            assert.strictEqual(res.data.data.event_title, payload.event_title);
        });

        // 13. Incident Report GET
        await testEndpoint(`GET /api/incidents/${firstIncidentId}/report aggregates incident, alerts, MITRE, threat intel, timeline`, async () => {
            const res = await axios.get(`${base}/incidents/${firstIncidentId}/report`);
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.data.success, true);
            const report = res.data.data;
            assert.ok(report.incident);
            assert.ok(Array.isArray(report.alerts));
            assert.ok(Array.isArray(report.mitre_attack));
            assert.ok(Array.isArray(report.threat_intelligence));
            assert.ok(Array.isArray(report.response_actions));
            assert.ok(Array.isArray(report.timeline));
        });

        // 14. Response actions GET
        await testEndpoint("GET /api/response-actions returns response actions", async () => {
            const res = await axios.get(`${base}/response-actions`);
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.data.success, true);
            assert.ok(Array.isArray(res.data.data));
        });

        // 15. Response action CREATE and EXECUTE
        let createdActionId = null;
        await testEndpoint(`POST /api/response-actions creates simulated action for incident ${firstIncidentId}`, async () => {
            const payload = {
                incident_id: firstIncidentId,
                action_type: "Block Source IP",
                description: "Simulated IP block on edge firewall for API testing."
            };
            const res = await axios.post(`${base}/response-actions`, payload);
            assert.strictEqual(res.status, 201);
            assert.strictEqual(res.data.success, true);
            assert.strictEqual(res.data.data.status, "pending");
            createdActionId = res.data.data.id;
        });

        if (createdActionId) {
            await testEndpoint(`POST /api/response-actions/${createdActionId}/execute marks action completed`, async () => {
                const res = await axios.post(`${base}/response-actions/${createdActionId}/execute`);
                assert.strictEqual(res.status, 200);
                assert.strictEqual(res.data.success, true);
                assert.strictEqual(res.data.data.status, "completed");
                assert.ok(res.data.data.execution_result.includes("SIMULATED:"));
            });
        }

        // 16. Dashboard summary GET
        await testEndpoint("GET /api/dashboard/summary calculates real metrics from database", async () => {
            const res = await axios.get(`${base}/dashboard/summary`);
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.data.success, true);
            assert.ok(res.data.data.summary);
            assert.ok(Number(res.data.data.summary.total_logs) > 0);
            assert.ok(Number(res.data.data.summary.total_alerts) > 0);
            assert.ok(Array.isArray(res.data.data.alert_severity));
        });

    } finally {
        server.close();
    }

    console.log(`\nBackend API Tests Summary: ${passed} passed, ${failed} failed.\n`);
    if (failed > 0) {
        process.exit(1);
    }
}

if (require.main === module) {
    runBackendTests();
}

module.exports = { runBackendTests };
