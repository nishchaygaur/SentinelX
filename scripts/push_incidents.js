/**
 * SentinelX Batch Incident Pusher
 * Generates and seeds diverse, authentic security incidents into the PostgreSQL database.
 * Cycles across all 15 MITRE-mapped enterprise attack scenarios with full telemetry:
 * Raw Logs -> Normalized Logs -> Alerts -> MITRE ATT&CK -> Threat Intel -> Incidents -> Timeline -> Responses.
 *
 * Usage:
 *   node scripts/push_incidents.js [count]
 * Example:
 *   node scripts/push_incidents.js 15
 */

const path = require("path");
const backendDir = path.join(__dirname, "../backend");
require(path.join(backendDir, "node_modules/dotenv")).config({ path: path.join(backendDir, ".env") });
const pool = require(path.join(backendDir, "src/config/db"));
const { createRandomSimulatedIncident, SCENARIOS } = require(path.join(backendDir, "src/services/randomIncidentService"));

const ANALYSTS = [
    "Alex Mercer (Lead Triage)",
    "Elena Vance (Forensics Specialist)",
    "Marcus Reed (Threat Intel Analyst)",
    "Sarah Connor (Incident Commander)"
];

const STATUS_OPTIONS = ["open", "investigating", "contained", "resolved"];

const INVESTIGATION_NOTES = {
    open: "Case newly established from high-severity telemetry correlation. Awaiting initial triage assignment.",
    investigating: "Forensics review active. Correlating host event logs with network boundary drops. Blast radius bounded.",
    contained: "Perimeter block rule enforced. Active attacker sessions terminated and compromised identities revoked.",
    resolved: "Incident eradicated. Host memory scans clean. Firewall rules persisted and post-incident briefing archived."
};

async function pushIncidents() {
    const rawCount = process.argv[2];
    const targetCount = rawCount ? parseInt(rawCount, 10) : 15;

    if (isNaN(targetCount) || targetCount <= 0) {
        console.error("Invalid count argument. Please specify a positive integer, e.g. node scripts/push_incidents.js 15");
        process.exit(1);
    }

    console.log("==================================================");
    console.log("     SENTINELX SECURITY INCIDENT BATCH PUSHER     ");
    console.log("==================================================");
    console.log(`Target: Generating and pushing ${targetCount} authentic incidents...\n`);

    const client = await pool.connect();
    const createdIncidents = [];

    try {
        for (let i = 0; i < targetCount; i++) {
            // Pick scenario sequentially from SCENARIOS to maximize variety
            const scenario = SCENARIOS[i % SCENARIOS.length];
            const result = await createRandomSimulatedIncident(scenario.id);

            // Determine realistic lifecycle distribution:
            // ~40% open, ~30% investigating, ~15% contained, ~15% resolved
            let status = "open";
            let assignedTo = null;
            const rand = Math.random();

            if (rand < 0.35) {
                status = "investigating";
                assignedTo = ANALYSTS[i % ANALYSTS.length];
            } else if (rand < 0.50) {
                status = "contained";
                assignedTo = ANALYSTS[(i + 1) % ANALYSTS.length];
            } else if (rand < 0.65) {
                status = "resolved";
                assignedTo = ANALYSTS[(i + 2) % ANALYSTS.length];
            }

            const notes = INVESTIGATION_NOTES[status];

            // Update incident with assigned analyst and status if not open
            if (status !== "open" || assignedTo) {
                await client.query(
                    `UPDATE incidents 
                     SET status = $1, assigned_to = $2, investigation_notes = $3, updated_at = CURRENT_TIMESTAMP
                     WHERE id = $4`,
                    [status, assignedTo, notes, result.id]
                );

                // Add timeline event for status transition
                await client.query(
                    `INSERT INTO incident_timeline 
                     (incident_id, event_type, event_title, event_description, severity, status, event_time)
                     VALUES ($1, 'investigation', $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
                    [
                        result.id,
                        `Incident transitioned to ${status.toUpperCase()}`,
                        `Assigned to ${assignedTo || "SOC Queue"}. Notes: ${notes}`,
                        result.severity,
                        status
                    ]
                );
            }

            createdIncidents.push({
                id: result.id,
                title: result.title,
                severity: result.severity.toUpperCase(),
                status: status.toUpperCase(),
                technique: `${scenario.mitre.techniqueId} (${scenario.mitre.techniqueName})`,
                assignedTo: assignedTo || "Unassigned"
            });

            process.stdout.write(`  [✓] Pushed INC-${result.id} [${result.severity.toUpperCase()}] - ${scenario.title.slice(0, 48)}...\n`);
        }

        console.log("\n==================================================");
        console.log(`  SUCCESSFULLY PUSHED ${createdIncidents.length} INCIDENTS TO DATABASE`);
        console.log("==================================================\n");

        console.table(
            createdIncidents.map(inc => ({
                ID: `INC-${inc.id}`,
                Severity: inc.severity,
                Status: inc.status,
                Analyst: inc.assignedTo,
                "MITRE Technique": inc.technique,
                Title: inc.title.slice(0, 40)
            }))
        );

        // Fetch new totals from database
        const totalsRes = await client.query(`
            SELECT 
                (SELECT COUNT(*) FROM incidents) as total_incidents,
                (SELECT COUNT(*) FROM incidents WHERE status = 'open') as open_incidents,
                (SELECT COUNT(*) FROM incidents WHERE status = 'investigating') as investigating_incidents,
                (SELECT COUNT(*) FROM incidents WHERE status = 'contained') as contained_incidents,
                (SELECT COUNT(*) FROM incidents WHERE status = 'resolved') as resolved_incidents,
                (SELECT COUNT(*) FROM alerts) as total_alerts
        `);

        const t = totalsRes.rows[0];
        console.log(`\nPlatform Database Statistics:`);
        console.log(`  Total Incidents in DB:    ${t.total_incidents}`);
        console.log(`  - Open:                   ${t.open_incidents}`);
        console.log(`  - Investigating:          ${t.investigating_incidents}`);
        console.log(`  - Contained:              ${t.contained_incidents}`);
        console.log(`  - Resolved:               ${t.resolved_incidents}`);
        console.log(`  Total Correlated Alerts:  ${t.total_alerts}\n`);

    } catch (err) {
        console.error("Batch incident push failed:", err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

pushIncidents();
