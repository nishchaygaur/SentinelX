# SentinelX — Log Ingestion Pipeline

## 1. Ingestion Endpoint (`POST /api/logs/ingest`)

Ingests single log objects or batch arrays of logs.

### Request Headers:
- `Content-Type: application/json`
- `x-ingestion-token: <token>` *(Required if `LOG_INGESTION_TOKEN` configured)*

### Payload Examples:

#### Single Log:
```json
{
  "source_type": "linux_ssh",
  "raw_message": "Sep 26 14:01:10 srv-bastion sshd[14101]: Failed password for invalid user admin from 185.220.101.5 port 41201 ssh2"
}
```

#### Batch Logs:
```json
[
  {
    "source_type": "firewall",
    "raw_message": "Sep 26 14:05:01 edge-fw01 kernel: [UFW BLOCK] IN=eth0 OUT= SRC=45.142.182.100 DST=10.0.0.1 PROTO=TCP SPT=55100 DPT=21"
  },
  {
    "source_type": "web_server",
    "raw_message": "198.51.100.55 - - [26/Sep/2026:14:02:10 +0000] \"GET /api/v1/users?id=1' UNION SELECT username,password,null FROM admin-- HTTP/1.1\" 403 512"
  }
]
```

---

## 2. Ingestion Response

HTTP 201 Created:
```json
{
  "success": true,
  "message": "Logs ingested and normalized successfully",
  "data": {
    "total_received": 2,
    "accepted_count": 2,
    "rejected_count": 0,
    "raw_log_ids": [101, 102],
    "normalized_log_ids": [101, 102]
  }
}
```
