const path = require("path");
const fs = require("fs");
require(path.join(__dirname, "../backend/node_modules/dotenv")).config({ path: path.join(__dirname, "../backend/.env") });
const app = require("../backend/src/app");

async function testApiEndpoints() {
    console.log("=== Testing SentinelX API Endpoints with Native HTTP ===");

    // Start server on an ephemeral port
    const server = await new Promise((resolve) => {
        const s = app.listen(0, () => resolve(s));
    });
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}/api`;
    console.log(`Server listening on ${baseUrl}`);

    try {
        // 1. Generate Random Incident via API
        console.log("\n[1] Testing POST /api/incidents/generate-random...");
        const genRes = await fetch(`${baseUrl}/incidents/generate-random`, {
            method: "POST",
            headers: { "Content-Type": "application/json" }
        });

        if (genRes.status !== 201) {
            const errText = await genRes.text();
            throw new Error(`Expected 201, got ${genRes.status}: ${errText}`);
        }

        const genBody = await genRes.json();
        if (!genBody.success || !genBody.data?.id) {
            throw new Error(`Invalid response body: ${JSON.stringify(genBody)}`);
        }

        const incident = genBody.data;
        console.log(`  -> Successfully created Incident #${incident.id}: "${incident.title}" (Severity: ${incident.severity})`);

        // 2. Fetch Consolidated JSON Report
        console.log(`\n[2] Testing GET /api/incidents/${incident.id}/report...`);
        const reportRes = await fetch(`${baseUrl}/incidents/${incident.id}/report`);
        if (reportRes.status !== 200) {
            throw new Error(`Expected 200, got ${reportRes.status}`);
        }

        const reportBody = await reportRes.json();
        const report = reportBody.data;
        if (!report || !report.incident || !report.alerts || report.alerts.length === 0) {
            throw new Error("Invalid incident report payload structure");
        }
        console.log(`  -> Report retrieved successfully:`);
        console.log(`     Alerts: ${report.alerts.length}`);
        console.log(`     MITRE: ${report.mitre_attack.length}`);
        console.log(`     Threat Intel: ${report.threat_intelligence.length}`);
        console.log(`     Timeline: ${report.timeline.length}`);
        console.log(`     Response Actions: ${report.response_actions.length}`);

        // 3. Download PDF Report
        console.log(`\n[3] Testing GET /api/incidents/${incident.id}/report/pdf...`);
        const pdfRes = await fetch(`${baseUrl}/incidents/${incident.id}/report/pdf`);
        if (pdfRes.status !== 200) {
            throw new Error(`Expected 200, got ${pdfRes.status}`);
        }

        const contentType = pdfRes.headers.get("content-type");
        if (!contentType || !contentType.includes("application/pdf")) {
            throw new Error(`Expected Content-Type application/pdf, got ${contentType}`);
        }

        const pdfArrayBuffer = await pdfRes.arrayBuffer();
        const pdfBuffer = Buffer.from(pdfArrayBuffer);
        const pdfHeader = pdfBuffer.slice(0, 5).toString("utf8");
        if (pdfHeader !== "%PDF-") {
            throw new Error(`Invalid PDF header: ${pdfHeader}`);
        }
        console.log(`  -> PDF downloaded successfully: ${pdfBuffer.length} bytes, Header: ${pdfHeader}`);

        // 4. Test Full Lifecycle on Generated Incident
        console.log(`\n[4] Testing Incident Lifecycle (Status -> Investigating)...`);
        const statusRes = await fetch(`${baseUrl}/incidents/${incident.id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "investigating" })
        });
        const statusBody = await statusRes.json();
        console.log(`  -> Status updated: ${statusBody.data.status}`);

        console.log(`\n[5] Testing Incident Lifecycle (Details -> Assigned Analyst & Notes)...`);
        const detailsRes = await fetch(`${baseUrl}/incidents/${incident.id}/details`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                assigned_to: "Senior SOC Analyst",
                investigation_notes: "Simulated incident analyzed. Firewall block rule active and host verified safe."
            })
        });
        const detailsBody = await detailsRes.json();
        console.log(`  -> Details updated: assigned_to=${detailsBody.data.assigned_to}`);

        console.log(`\n[6] Testing Timeline Append Event...`);
        const timelineRes = await fetch(`${baseUrl}/incidents/${incident.id}/timeline`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                event_type: "investigation",
                event_title: "Forensic verification completed",
                event_description: "Malicious IOCs validated across fleet. No additional compromised hosts found.",
                severity: "low"
            })
        });
        const timelineBody = await timelineRes.json();
        console.log(`  -> Timeline event appended: ${timelineBody.data.event_title}`);

        console.log(`\n[7] Testing Incident Lifecycle (Status -> Resolved)...`);
        const resolveRes = await fetch(`${baseUrl}/incidents/${incident.id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "resolved" })
        });
        const resolveBody = await resolveRes.json();
        console.log(`  -> Status updated: ${resolveBody.data.status}`);

        console.log("\n>>> ALL API ROUTE & LIFECYCLE TESTS PASSED! <<<");
    } finally {
        server.close();
    }
    process.exit(0);
}

testApiEndpoints().catch(err => {
    console.error("Test error:", err);
    process.exit(1);
});
