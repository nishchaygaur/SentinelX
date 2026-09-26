# SentinelX — Threat Intelligence Engine

## 1. Indicator Enrichment (`backend/src/services/threatIntelService.js`)

SentinelX enriches alerts with contextual threat intelligence by evaluating observable Indicators of Compromise (IoCs):
- **IP Addresses**: Mapped to reputation categories (`malicious`, `suspicious`, `clean`).
- **RFC 1918 Private IPs**: (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.1`) are identified and assigned internal scope.
- **File Hashes**: MD5 / SHA-256 signatures mapped to known malware families (e.g., LockBit 3.0, Mimikatz).
- **CVE Identifiers**: Mapped to published vulnerability advisories (e.g., CVE-2021-3156 Baron Samedit).

---

## 2. Persistence

Stored in the `threat_intelligence` table with foreign key cascade to `alerts`:
- `indicator_type`: `ip`, `domain`, `hash`, `cve`, `username`
- `indicator_value`: The observable string
- `threat_type`: `Botnet / Brute Force Node`, `Web Exploit Scanner`, etc.
- `reputation`: `malicious`, `suspicious`, `internal`
- `confidence`: Integer (0–100)
