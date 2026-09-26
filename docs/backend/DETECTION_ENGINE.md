# SentinelX — Detection Rules Engine

## 1. Engine Overview

The SentinelX Detection Rules Engine (`backend/src/detection/detectionRules.js`) executes deterministic algorithms across `normalized_logs` to identify hostile activity.

Execution: Triggered via `POST /api/detection/run`.

---

## 2. Implemented Detection Rules

### Rule 1: `BRUTE_FORCE_FAILED_LOGIN`
- **Target Event**: Repeated failed logins (`event_type = 'failed_login'` or `action = 'failed_login'`).
- **Algorithm**: Groups logs by `source_ip` and `username`. Applies a 5-minute sliding window. Triggers if count `>= 5`.
- **Severity**: `high` (escalated to `critical` if count `>= 15`).
- **Confidence**: 0.85 – 0.98.
- **MITRE**: T1110 (Brute Force).

### Rule 2: `PORT_SCAN_SWEEP`
- **Target Event**: Connection logs with source IP and destination port.
- **Algorithm**: Counts distinct `destination_port` values probed by a single source IP. Triggers if distinct ports `>= 5`.
- **Severity**: `high` (escalated to `critical` if `>= 20` ports).
- **Confidence**: 0.82 – 0.98.
- **MITRE**: T1046 (Network Service Discovery).

### Rule 3: `WEB_SQL_INJECTION`
- **Target Event**: HTTP requests and application log messages.
- **Algorithm**: Scans against regular expression patterns:
  - `/union\s+(all\s+)?select/i`
  - `/('|"|--|\/\*|;)\s*(or|and)\s+['"]?\d+['"]?\s*=\s*['"]?\d+/i`
  - `/select\s+.*\s+from\s+.*(information_schema|sysdatabases|users|admin)/i`
- **Severity**: `critical`.
- **Confidence**: 0.95.
- **MITRE**: T1190 (Exploit Public-Facing Application).

### Rule 4: `SUSPICIOUS_LOGIN_AFTER_FAILURES`
- **Target Event**: Successful login events (`event_type = 'login'` or `action = 'successful_login'`).
- **Algorithm**: Checks backwards within a 10-minute window for prior failed logins from the same user or IP. Triggers if prior failures `>= 3`.
- **Severity**: `high`.
- **Confidence**: 0.88.
- **MITRE**: T1078 (Valid Accounts).

### Rule 5: `MALWARE_INDICATOR_DETECTED`
- **Target Event**: Process creation, application logs, or host telemetry.
- **Algorithm**: Pattern matching against known offensive security tools:
  - Tools: `mimikatz`, `powershell -enc`, `certutil -urlcache`, `psexec`, `nc.exe`
  - Ransomware extensions: `.locked`, `.crypto`, `.lockbit`, `.enc`
- **Severity**: `critical`.
- **Confidence**: 0.95.
- **MITRE**: T1059.001 (PowerShell), T1204 (User Execution).

### Rule 6: `ANOMALOUS_SECURITY_ACTIVITY`
- **Target Event**: Overall normalized log stream.
- **Algorithm**: Statistical anomaly test. Calculates ratio of high/critical events to total events. Triggers if high-severity ratio `>= 40%` with at least 8 error events.
- **Severity**: `high`.
- **Confidence**: 0.82 – 0.85.
- **MITRE**: T1070 (Indicator Removal on Host / Defense Evasion).
