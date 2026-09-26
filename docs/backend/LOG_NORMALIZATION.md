# SentinelX — Log Normalization Engine

## 1. Overview

The normalization engine (`backend/src/ingestion/logNormalizer.js`) converts unstructured log lines from diverse operating systems, firewalls, and servers into a standardized schema stored in `normalized_logs`.

---

## 2. Standard Normalized Schema

| Field | Type | Description |
|---|---|---|
| `event_time` | TIMESTAMP | Exact time of event (parsed or UTC now) |
| `event_type` | VARCHAR(100) | Standard category (`failed_login`, `login`, `sql_injection`, `port_scan`, etc.) |
| `severity` | VARCHAR(20) | Standard severity: `low`, `medium`, `high`, `critical` |
| `source_ip` | INET | Extracted client or attacker IP |
| `destination_ip` | INET | Extracted server or target IP |
| `source_port` | INTEGER | Client port |
| `destination_port`| INTEGER | Service destination port |
| `username` | VARCHAR(100) | Authenticated or targeted account name |
| `hostname` | VARCHAR(255) | Originating machine or service host |
| `protocol` | VARCHAR(20) | Protocol (`SSH`, `TCP`, `HTTP`, `RPC`, etc.) |
| `action` | VARCHAR(50) | Action taken (`allow`, `drop`, `reject`, `failed_login`) |
| `message` | TEXT | Human-readable event description |
| `normalized_data`| JSONB | Extra metadata (Event IDs, HTTP method, URIs, User-Agents) |

---

## 3. Supported Parsers

1. **Windows Event Log Parser**: Parses Event IDs 4625 (Logon Failure), 4624 (Logon Success), 4688 (Process Creation with Mimikatz/PowerShell command extraction), and 7045 (Service Install).
2. **Linux SSH Parser**: Extracts failed passwords, accepted keys, invalid users, source IPs, and ports.
3. **Web Server Parser**: Parses Apache/Nginx Common (CLF) and Combined formats; analyzes URI parameters for SQL injection and directory traversal.
4. **Firewall Parser**: Extracts SRC, DST, PROTO, SPT, DPT, and DROP/BLOCK/REJECT actions from iptables/UFW logs.
5. **Application Parser**: Evaluates structured log level tags (`[ERROR]`, `[CRITICAL]`) and exception stack traces.
