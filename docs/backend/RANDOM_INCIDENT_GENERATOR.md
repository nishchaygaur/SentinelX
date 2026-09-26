# SentinelX — Synthetic Random Incident Generator

## 1. Purpose & SOC Training Use Case

The Random Incident Generator (`backend/src/services/randomIncidentService.js`) generates realistic attack scenarios at the click of a button. It is designed for:
- Live SOC analyst training and evaluation
- Demonstration of the end-to-end detection, alerting, and response pipeline
- Integration and regression testing without requiring real malware or network attacks

---

## 2. Generator Scenarios

| Scenario ID | Attack Title | MITRE Technique | Threat Intel |
|---|---|---|---|
| `ssh_brute_force` | SSH Brute Force with Root Access | T1110.001 (Password Guessing) | TOR Exit Node / Mirai Scanner |
| `sql_injection` | SQL Injection in Production Checkout API | T1190 (Exploit Public App) | Sqlmap Automated Probe |
| `privilege_escalation`| Sudo Baron Samedit Local Exploit | T1068 (Exploitation for Priv Esc) | CVE-2021-3156 Advisory |
| `ransomware_activity` | Mass File Encryption & Canary Trigger | T1486 (Data Encrypted for Impact) | LockBit 3.0 Encryptor Hash |
| `port_scan` | Stealth SYN Port Scanning Sweep | T1046 (Network Service Discovery)| Scanning Botnet Node |

---

## 3. Trigger Endpoint

`POST /api/incidents/generate-random`

Generates:
1. Normalized security log entry in `normalized_logs`
2. Alert in `alerts` with calculated risk score
3. Correlated incident case in `incidents`
4. Incident-alert mapping in `incident_alerts`
5. Mapped MITRE ATT&CK entry in `mitre_attack`
6. Enriched threat intelligence in `threat_intelligence`
7. Chronological timeline events in `incident_timeline`
8. Tailored containment action in `response_actions`
