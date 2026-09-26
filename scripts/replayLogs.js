/**
 * SentinelX Live Telemetry Replay Engine
 * Simulates real-time security events pumped into SentinelX via POST /api/logs/ingest
 *
 * Usage:
 *   node scripts/replayLogs.js [--url http://localhost:5000/api] [--delay 250] [--batch]
 */

const path = require("path");
const backendDir = path.join(__dirname, "../backend");
const axios = require(path.join(backendDir, "node_modules/axios"));

// Parse CLI arguments
const args = process.argv.slice(2);
function getArg(key, defaultVal) {
    const idx = args.indexOf(key);
    if (idx !== -1 && args[idx + 1]) return args[idx + 1];
    return defaultVal;
}
const hasFlag = (key) => args.includes(key);

const API_BASE = getArg("--url", "http://localhost:5000/api");
const DELAY_MS = parseInt(getArg("--delay", "200"), 10);
const IS_BATCH = hasFlag("--batch");

const REPLAY_SCENARIOS = [
    {
        name: "SSH Brute Force Attack",
        logs: [
            { source_type: "linux_ssh", raw_message: "Sep 24 03:00:01 web-bastion sshd[2201]: Failed password for root from 198.51.100.201 port 38210 ssh2" },
            { source_type: "linux_ssh", raw_message: "Sep 24 03:00:03 web-bastion sshd[2202]: Failed password for root from 198.51.100.201 port 38211 ssh2" },
            { source_type: "linux_ssh", raw_message: "Sep 24 03:00:05 web-bastion sshd[2203]: Failed password for root from 198.51.100.201 port 38212 ssh2" },
            { source_type: "linux_ssh", raw_message: "Sep 24 03:00:07 web-bastion sshd[2204]: Failed password for root from 198.51.100.201 port 38213 ssh2" },
            { source_type: "linux_ssh", raw_message: "Sep 24 03:00:09 web-bastion sshd[2205]: Failed password for root from 198.51.100.201 port 38214 ssh2" },
            { source_type: "linux_ssh", raw_message: "Sep 24 03:00:11 web-bastion sshd[2206]: Failed password for root from 198.51.100.201 port 38215 ssh2" }
        ]
    },
    {
        name: "Port Scanning Sweep",
        logs: [
            { source_type: "firewall", raw_message: "Sep 24 03:01:00 edge-fw01 kernel: [UFW BLOCK] IN=eth0 OUT= SRC=203.0.113.88 DST=10.0.0.1 PROTO=TCP SPT=49152 DPT=21" },
            { source_type: "firewall", raw_message: "Sep 24 03:01:01 edge-fw01 kernel: [UFW BLOCK] IN=eth0 OUT= SRC=203.0.113.88 DST=10.0.0.1 PROTO=TCP SPT=49153 DPT=22" },
            { source_type: "firewall", raw_message: "Sep 24 03:01:02 edge-fw01 kernel: [UFW BLOCK] IN=eth0 OUT= SRC=203.0.113.88 DST=10.0.0.1 PROTO=TCP SPT=49154 DPT=80" },
            { source_type: "firewall", raw_message: "Sep 24 03:01:03 edge-fw01 kernel: [UFW BLOCK] IN=eth0 OUT= SRC=203.0.113.88 DST=10.0.0.1 PROTO=TCP SPT=49155 DPT=443" },
            { source_type: "firewall", raw_message: "Sep 24 03:01:04 edge-fw01 kernel: [UFW BLOCK] IN=eth0 OUT= SRC=203.0.113.88 DST=10.0.0.1 PROTO=TCP SPT=49156 DPT=3389" }
        ]
    },
    {
        name: "Web Application SQL Injection",
        logs: [
            { source_type: "web_server", raw_message: "198.51.100.55 - - [24/Sep/2026:03:02:10 +0000] \"GET /api/v1/users?id=1' UNION SELECT username,password,null FROM admin-- HTTP/1.1\" 403 512" },
            { source_type: "web_server", raw_message: "198.51.100.55 - - [24/Sep/2026:03:02:15 +0000] \"POST /login HTTP/1.1\" 401 234" }
        ]
    },
    {
        name: "Malware & Credential Dumping Indicator",
        logs: [
            { source_type: "windows_events", raw_message: "EventID 4688: A new process has been created. Process Name: powershell.exe. CommandLine: powershell.exe -NoProfile -ExecutionPolicy Bypass -enc SQBFAFgA mimikatz.exe sekurlsa::logonpasswords" }
        ]
    }
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runReplay() {
    console.log("==================================================");
    console.log("      SENTINELX LOG REPLAY SIMULATION UTILITY     ");
    console.log("==================================================");
    console.log(`Target API Base : ${API_BASE}`);
    console.log(`Replay Mode     : ${IS_BATCH ? "Bulk Batch" : "Sequential Streaming"}`);
    console.log(`Stream Delay    : ${DELAY_MS} ms\n`);

    try {
        // Check API Health
        console.log("Checking SentinelX backend connectivity...");
        const health = await axios.get(`${API_BASE}/health`, { timeout: 3000 });
        console.log(`  -> Backend Status: ${health.data.status} | Mode: ${health.data.mode || "live"}\n`);
    } catch (err) {
        console.error(`ERROR: Cannot reach SentinelX API at ${API_BASE}. Ensure backend is running.`);
        console.error(`Details: ${err.message}`);
        process.exit(1);
    }

    let totalSent = 0;
    let totalAccepted = 0;

    for (const scenario of REPLAY_SCENARIOS) {
        console.log(`[SCENARIO] Replaying: ${scenario.name} (${scenario.logs.length} events)`);

        if (IS_BATCH) {
            try {
                const res = await axios.post(`${API_BASE}/logs/ingest`, scenario.logs);
                totalSent += scenario.logs.length;
                totalAccepted += res.data.data?.accepted_count || 0;
                console.log(`  -> Batch accepted: ${res.data.data?.accepted_count} logs ingested.`);
            } catch (err) {
                console.error(`  -> Failed to ingest batch: ${err.response?.data?.message || err.message}`);
            }
        } else {
            for (let i = 0; i < scenario.logs.length; i++) {
                const log = scenario.logs[i];
                try {
                    const res = await axios.post(`${API_BASE}/logs/ingest`, log);
                    totalSent++;
                    if (res.data.success) totalAccepted++;
                    process.stdout.write(`  [${i + 1}/${scenario.logs.length}] Ingested ${log.source_type} log (Raw ID: ${res.data.data?.raw_log_ids?.[0]})\r`);
                } catch (err) {
                    console.error(`\n  -> Event failed: ${err.response?.data?.message || err.message}`);
                }
                if (DELAY_MS > 0) await sleep(DELAY_MS);
            }
            console.log(`\n  -> Scenario ${scenario.name} complete.`);
        }
    }

    console.log(`\nTotal Ingested: ${totalAccepted}/${totalSent} events.`);

    // Trigger Detection Run
    console.log("\nExecuting detection rules engine on ingested telemetry...");
    try {
        const detectRes = await axios.post(`${API_BASE}/detection/run`);
        console.log(`Detection run completed successfully!`);
        console.log(`  Processed Alerts : ${detectRes.data.count || detectRes.data.alerts?.length || 0}`);

        // Fetch Dashboard Summary
        const summaryRes = await axios.get(`${API_BASE}/dashboard/summary`);
        const s = summaryRes.data.data;
        console.log(`\nUpdated SOC Metrics:`);
        console.log(`  - Total Normalized Logs : ${s.total_logs}`);
        console.log(`  - Total Active Alerts   : ${s.total_alerts}`);
        console.log(`  - Total Incidents       : ${s.total_incidents}`);
        console.log(`  - Average Risk Score    : ${s.average_risk_score}`);
    } catch (err) {
        console.error("Detection execution failed:", err.response?.data?.message || err.message);
    }

    console.log("\n==================================================");
    console.log("       REPLAY SIMULATION FINISHED SUCCESSFULLY    ");
    console.log("==================================================");
}

runReplay().catch(err => {
    console.error("Replay engine failed:", err);
    process.exit(1);
});
