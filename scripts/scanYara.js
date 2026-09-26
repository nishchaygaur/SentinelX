/**
 * SentinelX YARA Scanning Utility
 * Scans a file or directory using yara/rules/malware_rules.yar
 *
 * Usage:
 *   node scripts/scanYara.js <target_file_or_dir>
 */

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const rulesPath = path.resolve(__dirname, "../yara/rules/malware_rules.yar");
const targetPath = process.argv[2];

console.log("==================================================");
console.log("       SENTINELX YARA MALWARE SCAN UTILITY        ");
console.log("==================================================");
console.log(`Rule definitions : ${rulesPath}`);

if (!fs.existsSync(rulesPath)) {
    console.error(`ERROR: YARA rules not found at ${rulesPath}`);
    process.exit(1);
}

if (!targetPath) {
    console.log("\nUsage: node scripts/scanYara.js <path_to_file_or_directory>");
    console.log("Example: node scripts/scanYara.js yara/rules/malware_rules.yar\n");
    process.exit(0);
}

const resolvedTarget = path.resolve(process.cwd(), targetPath);
if (!fs.existsSync(resolvedTarget)) {
    console.error(`ERROR: Target path does not exist: ${resolvedTarget}`);
    process.exit(1);
}

console.log(`Scanning target  : ${resolvedTarget}\n`);
try {
    const output = execSync(`yara "${rulesPath}" "${resolvedTarget}"`, { encoding: "utf-8" });
    if (!output.trim()) {
        console.log("[CLEAN] No malware signatures detected.");
    } else {
        console.log("[ALERT] YARA Signatures Detected:");
        console.log(output);
    }
} catch (err) {
    console.error("YARA scan execution failed:", err.message);
    process.exit(1);
}
