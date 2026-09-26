/**
 * SentinelX Master Test Runner
 * Executes all detection tests, backend integration tests, and end-to-end pipeline tests.
 */

const { runDetectionTests } = require("./detection.test");
const { runBackendTests } = require("./backend.test");
const { runE2ETest } = require("./e2e.test");

async function main() {
    console.log("==================================================");
    console.log("       SENTINELX MASTER TEST SUITE EXECUTION       ");
    console.log("==================================================");

    try {
        await runDetectionTests();
        await runBackendTests();
        await runE2ETest();

        console.log("==================================================");
        console.log("   ALL SENTINELX TESTS COMPLETED WITH 100% PASS   ");
        console.log("==================================================");
        process.exit(0);
    } catch (err) {
        console.error("Test Suite Failure:", err);
        process.exit(1);
    }
}

main();
