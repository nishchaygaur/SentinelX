# SentinelX — Ingestion Security & Threat Mitigation

## 1. Ingestion Attack Vectors & Defenses

| Threat | Attack Scenario | SentinelX Defense |
|---|---|---|
| **Denial of Service (DoS)** | Massive payload transmission | Express JSON parser limited to 5 MB (`limit: "5mb"`). |
| **SQL Injection** | Attacker injects `' OR 1=1` into log message | 100% Parameterized queries with `$1..$N`. |
| **Log Injection / CRLF** | Attacker inserts newline characters to spoof logs | Inputs sanitized; raw messages stored in text columns. |
| **Unauthorized Telemetry** | Rogue actors sending fake logs | Protected by `x-ingestion-token` authentication. |
| **Buffer Overflow / Format String** | Malformed memory payloads | Safe Node.js runtime memory management. |
