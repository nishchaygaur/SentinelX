const path = require("path");
const fs = require("fs");
require(path.join(__dirname, "../backend/node_modules/dotenv")).config({ path: path.join(__dirname, "../backend/.env") });

const { createRandomSimulatedIncident } = require("../backend/src/services/randomIncidentService");
const { fetchIncidentReportData } = require("../backend/src/controllers/reportController");
const { generateIncidentReportPdf } = require("../backend/src/services/pdfReportService");

async function run() {
    console.log("=== Testing Random Incident Generation & PDF Export ===");

    const generatedIds = [];
    for (let i = 1; i <= 5; i++) {
        console.log(`\n[TEST ${i}] Generating random incident...`);
        const incident = await createRandomSimulatedIncident();
        console.log(`Created Incident #${incident.id}: "${incident.title}" (Severity: ${incident.severity}, Priority: ${incident.priority})`);
        generatedIds.push(incident.id);

        // Fetch report
        const report = await fetchIncidentReportData(incident.id);
        if (!report) throw new Error(`Report for incident ${incident.id} not found!`);
        console.log(`- Linked alerts: ${report.alerts.length}`);
        console.log(`- MITRE mappings: ${report.mitre_attack.length}`);
        console.log(`- Threat intel indicators: ${report.threat_intelligence.length}`);
        console.log(`- Response actions: ${report.response_actions.length}`);
        console.log(`- Timeline events: ${report.timeline.length}`);
    }

    console.log("\n[TEST PDF] Testing PDF generation on Incident #" + generatedIds[0] + "...");
    const reportData = await fetchIncidentReportData(generatedIds[0]);
    const pdfPath = path.join(__dirname, `test_incident_${generatedIds[0]}.pdf`);
    const outStream = fs.createWriteStream(pdfPath);

    await new Promise((resolve, reject) => {
        outStream.on("finish", resolve);
        outStream.on("error", reject);
        generateIncidentReportPdf(reportData, outStream);
    });

    const stats = fs.statSync(pdfPath);
    console.log(`PDF generated successfully: ${pdfPath} (${stats.size} bytes)`);

    // Verify PDF header bytes
    const header = fs.readFileSync(pdfPath, { encoding: "utf8", flag: "r" }).slice(0, 5);
    if (header !== "%PDF-") {
        throw new Error(`Invalid PDF header: ${header}`);
    }
    console.log(`PDF header validated: ${header}`);

    // Cleanup test PDF
    fs.unlinkSync(pdfPath);
    console.log("Cleaned up temporary test PDF.");

    console.log("\n>>> ALL RANDOM INCIDENT AND PDF TESTS PASSED! <<<");
    process.exit(0);
}

run().catch(err => {
    console.error("Test failed:", err);
    process.exit(1);
});
