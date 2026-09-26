# SentinelX — Database Seeder & Test Datasets

## 1. Overview

The deterministic database seeder (`scripts/seed.js`) synthesizes authentic cybersecurity attack scenarios and benign baselines, running them through the full ingestion, normalization, detection, and enrichment pipeline.

---

## 2. Seed Scenarios

1. **Linux SSH Brute Force**: 6 consecutive failed password attempts for invalid user `admin` from IP `185.220.101.5` targeting port 22.
2. **External Port Scan Sweep**: 6 blocked firewall drops from `45.142.182.100` scanning ports 21, 22, 23, 80, 443, and 3389.
3. **Web SQL Injection Attack**: Malicious GET request containing `UNION SELECT username,password FROM admin--` targeting public API.
4. **Suspicious Logon After Failures**: 4 failed logins followed by a successful authentication for user `svc_deploy` from `198.51.100.44`.
5. **Malware & Credential Dumping**: Windows Event 4688 recording `powershell.exe -enc ... mimikatz.exe sekurlsa::logonpasswords`.
6. **Benign Background Telemetry**: Standard successful logins, allowed HTTP GET requests, and benign application events.

---

## 3. Executing the Seeder

```bash
node scripts/seed.js
```
