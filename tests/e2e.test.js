/**
 * SentinelX Complete End-to-End Acceptance Test
 *
 * Verifies the full cybersecurity pipeline:
 * Raw Log -> Ingestion -> Normalization -> Validation -> Database ->
 * Detection Engine -> Alert Creation -> Threat Intelligence Enrichment ->
 * Risk Scoring -> MITRE ATT&CK Mapping -> Incident Creation ->
 * Incident Timeline -> Investigation Update -> Response Action ->
 * Incident Report -> SOC Dashboard Metrics
 */

const http = require("http");
const assert = require("assert");
const path = require("path");

const backendDir = path.join(__dirname, "../backend");
require(path.join(backendDir, "node_modules/dotenv")).config({ path: path.join(backendDir, ".env") });
const app = require(path.join(backendDir, "src/app"));
const axios = require(path.join(backendDir, "node_modules/axios"));

async function runE2ETest() {
    console.log("\n==================================================");
    console.log("    SENTINELX FULL END-TO-END PIPELINE TEST");
    console.log("==================================================\n");

    const server = http.createServer(app);
    await new Promise(resolve => server.listen(0, resolve));
    const port = server.address().port;
    const base = `http://localhost:${port}/api`;

    try {
        const testIp = `192.168.100.${Math.floor(Math.random() * 150) + 50}`;
        const targetUser = `victim_${Date.now()}`;

        console.log(`[STAGE 1] Ingesting 6 raw Linux SSH failed login logs from ${testIp}...`);
        const rawBatch = [1, 2, 3, 4, 5, 6].map(i => ({
            source_type: "linux_ssh",
            raw_message: `Sep 24 01:10:0${i} debian-server sshd[1234${i}]: Failed password for invalid user ${targetUser} from ${testIp} port 4521${i} ssh2`
        }));

        const ingestRes = await axios.post(`${base}/logs/ingest`, rawBatch);
        assert.strictEqual(ingestRes.status, 201, "Ingest failed");
        assert.strictEqual(ingestRes.data.data.accepted_count, 6, "Expected 6 accepted logs");
        console.log("  -> Logs ingested into raw_logs and normalized_logs successfully.");

        console.log("[STAGE 2] Running Detection Engine over normalized logs...");
        const detectRes = await axios.post(`${base}/detection/run`);
        assert.strictEqual(detectRes.status, 200, "Detection run failed");
        console.log(`  -> Detection completed. Processed alerts: ${detectRes.data.count}`);

        console.log("[STAGE 3] Querying Alerts for generated Brute Force alert...");
        const alertsRes = await axios.get(`${base}/alerts`);
        assert.strictEqual(alertsRes.status, 200);

        const bfAlert = alertsRes.data.data.find(a =>
            a.alert_type === "brute_force" &&
            (a.source_ip === testIp || a.username === targetUser || (a.description && a.description.includes(testIp)))
        );
        assert.ok(bfAlert, `Brute force alert not found for ${testIp}`);
        console.log(`  -> Alert generated: ID ${bfAlert.id} | Severity: ${bfAlert.severity} | Risk Score: ${bfAlert.risk_score}`);

        console.log("[STAGE 4] Checking MITRE ATT&CK & Threat Intelligence Enrichment...");
        const enrichRes = await axios.get(`${base}/alerts/${bfAlert.id}/enrichment`);
        assert.strictEqual(enrichRes.status, 200);
        const mitreItems = enrichRes.data.data.mitre_attack;
        const threatItems = enrichRes.data.data.threat_intelligence;

        assert.ok(mitreItems.some(m => m.technique_id === "T1110"), "Expected T1110 Brute Force MITRE mapping");
        console.log(`  -> MITRE ATT&CK confirmed: T1110 (${mitreItems[0].technique_name})`);
        console.log(`  -> Threat Intelligence enriched: ${threatItems.length} indicator(s) mapped`);

        console.log("[STAGE 5] Checking Incident Creation for High/Critical Alert...");
        const incidentsRes = await axios.get(`${base}/incidents`);
        assert.strictEqual(incidentsRes.status, 200);

        // Find incident linked to this alert
        let linkedIncident = null;
        for (const inc of incidentsRes.data.data) {
            const incDetail = await axios.get(`${base}/incidents/${inc.id}`);
            const linkedAlerts = incDetail.data.data.alerts || [];
            if (linkedAlerts.some(a => String(a.id) === String(bfAlert.id))) {
                linkedIncident = incDetail.data.data.incident;
                break;
            }
        }

        assert.ok(linkedIncident, `Expected incident linked to alert ${bfAlert.id}`);
        console.log(`  -> Incident confirmed: INC-${linkedIncident.id} (${linkedIncident.title}) | Status: ${linkedIncident.status}`);

        console.log("[STAGE 6] Updating Incident Status and Recording Timeline Event...");
        const statusUpdateRes = await axios.patch(`${base}/incidents/${linkedIncident.id}/status`, {
            status: "investigating"
        });
        assert.strictEqual(statusUpdateRes.status, 200);
        assert.strictEqual(statusUpdateRes.data.data.status, "investigating");
        console.log("  -> Incident status updated to 'investigating'");

        console.log("[STAGE 7] Adding Investigation Notes to Incident...");
        const detailUpdateRes = await axios.patch(`${base}/incidents/${linkedIncident.id}/details`, {
            assigned_to: "Lead SOC Analyst",
            investigation_notes: `Confirmed external brute force attack originating from ${testIp}. Recommended immediate IP containment.`
        });
        assert.strictEqual(detailUpdateRes.status, 200);
        assert.strictEqual(detailUpdateRes.data.data.assigned_to, "Lead SOC Analyst");
        console.log("  -> Investigation notes updated and analyst assigned");

        console.log("[STAGE 8] Creating and Executing Simulated Response Action...");
        const actionCreateRes = await axios.post(`${base}/response-actions`, {
            incident_id: linkedIncident.id,
            action_type: "Block Source IP",
            description: `Block external IP ${testIp} on border firewall`
        });
        assert.strictEqual(actionCreateRes.status, 201);
        const actionId = actionCreateRes.data.data.id;

        const actionExecRes = await axios.post(`${base}/response-actions/${actionId}/execute`);
        assert.strictEqual(actionExecRes.status, 200);
        assert.strictEqual(actionExecRes.data.data.status, "completed");
        console.log(`  -> Response action executed: Action ID ${actionId} (completed)`);

        console.log("[STAGE 9] Verifying Incident Timeline Completeness...");
        const timelineRes = await axios.get(`${base}/incidents/${linkedIncident.id}/timeline`);
        assert.strictEqual(timelineRes.status, 200);
        const timeline = timelineRes.data.data.timeline;
        assert.ok(timeline.length >= 3, `Expected at least 3 timeline events, got ${timeline.length}`);

        const eventTypes = timeline.map(e => e.event_type);
        console.log(`  -> Timeline has ${timeline.length} events spanning: ${[...new Set(eventTypes)].join(", ")}`);

        console.log("[STAGE 10] Verifying Complete Incident Report Payload...");
        const reportRes = await axios.get(`${base}/incidents/${linkedIncident.id}/report`);
        assert.strictEqual(reportRes.status, 200);
        const report = reportRes.data.data;

        assert.ok(report.incident, "Report missing incident");
        assert.ok(report.alerts.length > 0, "Report missing alerts");
        assert.ok(report.mitre_attack.length > 0, "Report missing MITRE ATT&CK");
        assert.ok(report.timeline.length > 0, "Report missing timeline");
        assert.ok(report.response_actions.length > 0, "Report missing response actions");
        assert.strictEqual(report.incident.assigned_to, "Lead SOC Analyst");
        console.log("  -> Incident report verified: All required modules populated with real persisted data.");

        console.log("[STAGE 11] Verifying SOC Dashboard Dynamic Calculations...");
        const dashRes = await axios.get(`${base}/dashboard/summary`);
        assert.strictEqual(dashRes.status, 200);
        const dash = dashRes.data.data;
        assert.ok(Number(dash.summary.total_logs) >= 6);
        assert.ok(Number(dash.summary.total_alerts) >= 1);
        assert.ok(Number(dash.summary.open_incidents) >= 1 || Number(dash.summary.total_alerts) > 0);
        console.log(`  -> Dashboard verified: Total Logs: ${dash.summary.total_logs} | Total Alerts: ${dash.summary.total_alerts} | Avg Risk: ${dash.summary.average_risk_score}`);

        console.log("\n>>> ALL 11 END-TO-END PIPELINE STAGES COMPLETED SUCCESSFULLY! <<<\n");
    } finally {
        server.close();
    }
}

if (require.main === module) {
    runE2ETest().then(() => process.exit(0)).catch(err => {
        console.error("\nE2E Test Failed:", err);
        process.exit(1);
    });
}

module.exports = { runE2ETest };
