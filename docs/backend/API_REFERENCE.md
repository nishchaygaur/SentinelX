# SentinelX — API Reference & Architectural Guide

## 1. Base URL & Protocol

All SentinelX API endpoints are namespaced under `/api` over HTTPS:
- Local Development: `http://localhost:5000/api`
- Production (Render): `https://<your-service>.onrender.com/api`

---

## 2. Standard Response Envelope

All API endpoints return JSON conforming to a standardized response envelope:

### Success Response:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional descriptive status message"
}
```

### Error Response:
```json
{
  "success": false,
  "message": "Specific error description",
  "error": "Detailed error object (development only)"
}
```

---

## 3. Top-Level Health Probes

- `GET /health`
- `GET /api/health`

Returns service status and UTC timestamp. Does not require authentication or database query.

```json
{
  "status": "healthy",
  "service": "SentinelX Backend",
  "timestamp": "2026-09-26T14:30:00.000Z"
}
```
