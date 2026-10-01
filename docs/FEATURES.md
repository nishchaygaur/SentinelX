# SentinelX — Feature Specification

## 1. Feature Matrix

The following table provides a complete breakdown of features implemented in SentinelX:

| Category | Feature | Status | Verification Reference |
|---|---|---|---|
| **Ingestion** | Multi-source batch ingestion API | **Production** | `tests/backend.test.js`, `POST /api/logs/ingest` |
| **Ingestion** | Token-based security authentication | **Production** | `backend/src/controllers/ingestionController.js` |
| **Ingestion** | Strict input validation & sanitization | **Production** | `backend/src/ingestion/logValidator.js` |
| **Normalization** | Windows Event Log parser (4625, 4624, 4688) | **Production** | `backend/src/ingestion/logNormalizer.js` |
| **Normalization** | Linux SSH auth parser (Failed, Accepted, Invalid) | **Production** | `backend/src/ingestion/logNormalizer.js` |
| **Normalization** | Web Server Common & Combined log parser | **Production** | `backend/src/ingestion/logNormalizer.js` |
| **Normalization** | Firewall UFW & iptables packet parser | **Production** | `backend/src/ingestion/logNormalizer.js` |
| **Normalization** | Application exception & security log parser | **Production** | `backend/src/ingestion/logNormalizer.js` |
| **Detection** | SSH & Auth Brute Force Detection | **Production** | Rule `BRUTE_FORCE_FAILED_LOGIN`, MITRE T1110 |
| **Detection** | Port Scan & Network Reconnaissance Sweep | **Production** | Rule `PORT_SCAN_SWEEP`, MITRE T1046 |
| **Detection** | Web SQL Injection Attack Detection | **Production** | Rule `WEB_SQL_INJECTION`, MITRE T1190 |
| **Detection** | Suspicious Login After Repeated Failures | **Production** | Rule `SUSPICIOUS_LOGIN_AFTER_FAILURES`, MITRE T1078 |
| **Detection** | Malware & Credential Dumping Indicators | **Production** | Rule `MALWARE_INDICATOR_DETECTED`, MITRE T1059.001 |
| **Detection** | Statistical Anomaly & Telemetry Surge Detection | **Production** | Rule `ANOMALOUS_SECURITY_ACTIVITY`, MITRE T1070 |
| **Scoring** | Transparent 0–100 Explainable Risk Formula | **Production** | `backend/src/services/riskScoringService.js` |
| **Enrichment** | Threat Intelligence IoC Matching | **Production** | `backend/src/services/threatIntelService.js` |
| **Enrichment** | MITRE ATT&CK Tactic & Technique Mapping | **Production** | `backend/src/services/mitreService.js` |
| **Incidents** | Automated Incident Creation for High/Critical | **Production** | `backend/src/controllers/incidentController.js` |
| **Incidents** | Chronological Incident Audit Timeline | **Production** | Table `incident_timeline`, `GET /api/incidents/:id/timeline` |
| **Incidents** | Synthetic Random Incident Generator | **Production** | `backend/src/services/randomIncidentService.js` |
| **AI Copilot** | OpenRouter AI Threat Investigation | **Production** | `backend/src/services/aiService.js` |
| **Response** | Simulated Incident Containment Actions | **Production** | `backend/src/controllers/responseActionController.js` |
| **Reporting** | Server-Side Dynamic PDF Report Generation | **Production** | `backend/src/services/pdfReportService.js` |
| **Scanner** | Native YARA v4.5.5 Malware File Scanner | **Production** | `yara/rules/malware_rules.yar`, `scripts/scanYara.js` |
| **MITRE Matrix** | Interactive 14-Tactic ATT&CK Heatmap Matrix & Coverage Analytics | **Production** | `GET /api/mitre/matrix`, `frontend/src/components/MitreHeatmap.jsx` |
| **AI Swarm** | Autonomous 4-Agent Swarm (Triage, Hunter, Intel, Responder) & Copilot | **Production** | `POST /api/ai/chat`, `POST /api/ai/swarm-investigate`, `frontend/src/components/AICopilot.jsx` |
| **UI** | Real-time SOC Executive & Operational Dashboard | **Production** | React 19 Frontend (`frontend/src/App.jsx`) |
| **UI** | Dedicated Full-Screen Documentation Explorer | **Production** | Dedicated Route `/docs` |

---

## 2. Detection Rule Details

### 1. Brute Force Detection (`BRUTE_FORCE_FAILED_LOGIN`)
- **Condition**: 5 or more failed login events from the same IP address or targeting the same username within a 5-minute sliding window.
- **Severity**: High (Critical if `>= 15` attempts).
- **ATT&CK**: T1110 (Brute Force).

### 2. Port Scan Detection (`PORT_SCAN_SWEEP`)
- **Condition**: 5 or more distinct destination ports probed by a single source IP.
- **Severity**: High (Critical if `>= 20` ports).
- **ATT&CK**: T1046 (Network Service Discovery).

### 3. SQL Injection Detection (`WEB_SQL_INJECTION`)
- **Condition**: RegEx match against SQL injection attack vectors in request URI, query parameters, or payload messages.
- **Severity**: Critical.
- **ATT&CK**: T1190 (Exploit Public-Facing Application).

### 4. Suspicious Login Detection (`SUSPICIOUS_LOGIN_AFTER_FAILURES`)
- **Condition**: Successful logon event preceded by multiple failed authentication attempts within a 10-minute window from the same user or IP.
- **Severity**: High.
- **ATT&CK**: T1078 (Valid Accounts).

### 5. Malware Indicator Detection (`MALWARE_INDICATOR_DETECTED`)
- **Condition**: Detection of offensive tool signatures (e.g., Mimikatz, `powershell -enc`, PsExec, `certutil -urlcache`, ransomware extensions like `.lockbit`).
- **Severity**: Critical.
- **ATT&CK**: T1059.001 (PowerShell), T1204 (User Execution).

### 6. Anomalous Activity Detection (`ANOMALOUS_SECURITY_ACTIVITY`)
- **Condition**: Statistical surge where high/critical severity security events exceed 40% of total traffic and volume `>= 8` error events.
- **Severity**: High.
- **ATT&CK**: T1070 (Indicator Removal on Host / Defense Evasion).
