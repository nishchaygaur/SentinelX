# SentinelX — API Error Codes & Status Codes

| HTTP Status | Reason Phrase | Common Scenario |
|---|---|---|
| `200 OK` | Request Succeeded | Normal query or update response. |
| `201 Created` | Resource Created | Log ingestion accepted, incident generated, response action staged. |
| `400 Bad Request` | Malformed Request | Empty log array, missing required payload parameters. |
| `401 Unauthorized` | Missing / Invalid Token | `x-ingestion-token` mismatch when token security is enabled. |
| `403 Forbidden` | Origin Disallowed | Cross-Origin request from unauthorized origin blocked by CORS. |
| `404 Not Found` | Resource Not Found | Incident or alert ID does not exist in database. |
| `500 Internal Error`| Server Exception | Database unreachable, OpenRouter API failure. |
