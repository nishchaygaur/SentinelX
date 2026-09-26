/**
 * SentinelX Detection Configuration
 * Centralized, configurable thresholds and parameters for all detection rules.
 */

module.exports = {
    // 1. Brute Force Detection
    bruteForce: {
        failedLoginsThreshold: 5,
        timeWindowMinutes: 5,
        criticalThreshold: 15
    },

    // 2. Port Scan Detection
    portScan: {
        uniquePortsThreshold: 5,
        timeWindowMinutes: 5,
        criticalThreshold: 20
    },

    // 3. SQL Injection Detection
    sqlInjection: {
        patterns: [
            /\bunion\s+select\b/i,
            /\bunion\s+all\s+select\b/i,
            /'?\s*\bor\s+['"]?1['"]?\s*=\s*['"]?1['"]?/i,
            /'\s*or\s*''\s*=\s*'/i,
            /\binformation_schema\b/i,
            /\bdrop\s+table\b/i,
            /\bselect\s+.*\s+from\b/i,
            /--\s*$/,
            /\/\*[\s\S]*?\*\//
        ]
    },

    // 4. Suspicious Login Detection
    suspiciousLogin: {
        failureToSuccessWindowMinutes: 10,
        privilegedAccounts: ["root", "admin", "administrator", "system", "guest"],
        failedAttemptsBeforeSuccessThreshold: 2
    },

    // 5. Malware Indicator Detection
    malwareIndicator: {
        suspiciousFiles: [
            "mimikatz.exe",
            "mimikatz",
            "nc.exe",
            "netcat",
            "psexec.exe",
            "psexec",
            "c99.php",
            "r57.php",
            "webshell.php",
            "revshell.sh",
            "wannacry.exe",
            "wannacry"
        ],
        suspiciousExtensions: [
            ".locked",
            ".crypto",
            ".wncry"
        ],
        suspiciousCommands: [
            "powershell -enc",
            "powershell -encodedcommand",
            "powershell -w hidden",
            "certutil -urlcache",
            "bash -i >& /dev/tcp/",
            "vssadmin delete shadows"
        ],
        knownMaliciousHashes: [
            // EICAR and benchmark simulation hashes
            "44d88612fea8a8f36de82e1278abb02f",
            "275a021bbfb6489e54d471899f7db9d1663fc695ec2fe2a2c4538aabf651fd0f",
            "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        ]
    },

    // 6. Anomalous Activity Detection
    anomalousActivity: {
        spikeMultiplier: 3.0,
        windowMinutes: 15,
        minEventsForAnomaly: 10
    }
};
