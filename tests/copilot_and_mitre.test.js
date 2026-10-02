/**
 * SentinelX Automated Test Suite
 * Validates:
 * 1. Interactive MITRE ATT&CK Enterprise Matrix & Heatmap Service
 * 2. Conversational AI Copilot & 4-Agent Autonomous Swarm
 */

const assert = require("assert");
const http = require("http");
const path = require("path");

const backendDir = path.join(__dirname, "../backend");
require(path.join(backendDir, "node_modules/dotenv")).config({ path: path.join(backendDir, ".env") });
const app = require(path.join(backendDir, "src/app"));
const axios = require(path.join(backendDir, "node_modules/axios"));
const {
    ENTERPRISE_TACTICS,
    ENTERPRISE_TECHNIQUES,
    getMitreHeatmapData,
    getTechniqueById
} = require(path.join(backendDir, "src/services/mitreService"));
const {
    SWARM_AGENTS,
    chatWithCopilot
} = require(path.join(backendDir, "src/services/aiCopilotService"));

async function runCopilotAndMitreTests() {
    console.log("\n==================================================");
    console.log("   SENTINELX COPILOT & MITRE HEATMAP TEST SUITE   ");
    console.log("==================================================\n");

    let passed = 0;
    let failed = 0;

    function test(name, fn) {
        try {
            fn();
            console.log(`  [PASS] ${name}`);
            passed++;
        } catch (err) {
            console.error(`  [FAIL] ${name}: ${err.message}`);
            failed++;
        }
    }

    async function testAsync(name, fn) {
        try {
            await fn();
            console.log(`  [PASS] ${name}`);
            passed++;
        } catch (err) {
            console.error(`  [FAIL] ${name}: ${err.message}`);
            failed++;
        }
    }

    // 1. MITRE Catalog Unit Tests
    test("MITRE Tactics Catalog contains all 14 standard enterprise tactics", () => {
        assert.strictEqual(ENTERPRISE_TACTICS.length, 14);
        assert.strictEqual(ENTERPRISE_TACTICS[0].id, "TA0043"); // Reconnaissance
        assert.strictEqual(ENTERPRISE_TACTICS[13].id, "TA0040"); // Impact
    });

    test("MITRE Techniques Catalog covers core adversary techniques", () => {
        assert.ok(ENTERPRISE_TECHNIQUES.length >= 35);
        const bruteForce = ENTERPRISE_TECHNIQUES.find(t => t.id === "T1110");
        assert.ok(bruteForce);
        assert.strictEqual(bruteForce.name, "Brute Force");
        assert.strictEqual(bruteForce.covered, true);
        assert.strictEqual(bruteForce.rule, "BRUTE_FORCE_FAILED_LOGIN");
    });

    test("MITRE Technique inspection by ID resolves metadata and mitigations", () => {
        const sqli = getTechniqueById("T1190");
        assert.ok(sqli);
        assert.strictEqual(sqli.name, "Exploit Public-Facing Application");
        assert.strictEqual(sqli.covered, true);
        assert.ok(sqli.mitigations.length > 0);
        assert.ok(sqli.url.includes("attack.mitre.org"));
    });

    await testAsync("getMitreHeatmapData computes accurate coverage percentages", async () => {
        const data = await getMitreHeatmapData();
        assert.ok(data.tactics.length === 14);
        assert.ok(data.coverage_summary.coverage_percentage > 0);
        assert.ok(data.coverage_summary.covered_techniques > 0);
        assert.ok(data.coverage_summary.blind_spots >= 0);
    });

    // 2. Swarm Agents Unit Tests
    test("Swarm Agents Catalog defines 4 specialist agents plus swarm lead", () => {
        const agentKeys = Object.keys(SWARM_AGENTS);
        assert.ok(agentKeys.includes("triage"));
        assert.ok(agentKeys.includes("hunter"));
        assert.ok(agentKeys.includes("intel"));
        assert.ok(agentKeys.includes("responder"));
        assert.ok(agentKeys.includes("swarm"));

        assert.strictEqual(SWARM_AGENTS.triage.name, "Sentinel-Triage");
        assert.strictEqual(SWARM_AGENTS.hunter.name, "Sentinel-Hunter");
        assert.strictEqual(SWARM_AGENTS.intel.name, "Sentinel-Intel");
        assert.strictEqual(SWARM_AGENTS.responder.name, "Sentinel-Responder");
    });

    await testAsync("Copilot chat generates tactical containment commands for responder agent", async () => {
        const res = await chatWithCopilot({
            message: "Generate firewall block commands for attacker 185.220.101.5",
            agentRole: "responder"
        });
        assert.ok(res && res.response && res.response.length > 0);
        assert.strictEqual(res.agent.id, "responder");
        assert.ok(res.model);
    });

    await testAsync("Copilot chat generates blast radius and hunting queries for hunter agent", async () => {
        const res = await chatWithCopilot({
            message: "Analyze blast radius, lateral movement, and patient zero",
            agentRole: "hunter"
        });
        assert.ok(res && res.response && res.response.length > 0);
        assert.strictEqual(res.agent.id, "hunter");
        assert.ok(res.model);
    });

    // 3. API Integration Tests (In-Memory HTTP Server)
    const server = http.createServer(app);
    await new Promise(resolve => server.listen(0, resolve));
    const port = server.address().port;
    const base = `http://localhost:${port}/api`;

    try {
        await testAsync("GET /api/mitre/matrix returns HTTP 200 with full heatmap payload", async () => {
            const res = await axios.get(`${base}/mitre/matrix`);
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.data.success, true);
            assert.strictEqual(res.data.data.tactics.length, 14);
            assert.ok(res.data.data.coverage_summary);
        });

        await testAsync("GET /api/mitre/techniques/T1110 returns HTTP 200 with technique details", async () => {
            const res = await axios.get(`${base}/mitre/techniques/T1110`);
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.data.success, true);
            assert.strictEqual(res.data.data.name, "Brute Force");
        });

        await testAsync("GET /api/ai/agents returns HTTP 200 with all 5 agent personas", async () => {
            const res = await axios.get(`${base}/ai/agents`);
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.data.success, true);
            assert.strictEqual(res.data.data.length, 5);
        });

        await testAsync("POST /api/ai/chat returns HTTP 200 with formatted SOC assessment", async () => {
            const res = await axios.post(`${base}/ai/chat`, {
                message: "Triage inbound port sweep from 10.0.0.99",
                agentRole: "triage"
            });
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.data.success, true);
            assert.ok(res.data.data.response);
            assert.strictEqual(res.data.data.agent.id, "triage");
        });
    } finally {
        server.close();
    }

    console.log(`\nCopilot & MITRE Tests Summary: ${passed} passed, ${failed} failed.\n`);
    if (failed > 0) {
        throw new Error(`${failed} tests failed in Copilot & MITRE test suite`);
    }
}

if (require.main === module) {
    runCopilotAndMitreTests()
        .then(() => process.exit(0))
        .catch(err => {
            console.error("Test execution failed:", err);
            process.exit(1);
        });
}

module.exports = { runCopilotAndMitreTests };
