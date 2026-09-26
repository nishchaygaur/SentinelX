# SentinelX — Authentication & Security Architecture

## 1. Security Architecture

SentinelX implements a defense-in-depth model across HTTP transport, payload ingestion, and database interaction:

```
┌─────────────────────────────────────────────────────────────┐
│                       SECURITY LAYERS                       │
├───────────────────┬─────────────────────────────────────────┤
│ Layer             │ Implementation                          │
├───────────────────┼─────────────────────────────────────────┤
│ Transport         │ HTTPS / TLS enforced                    │
│ Headers           │ Helmet (CSP, HSTS, XSS, nosniff, etc.)   │
│ CORS              │ Dynamic origin validator                │
│ Ingestion Auth    │ Optional secret token (x-ingestion-token)│
│ Input Validation  │ Strict regex, type, and range validation│
│ Database Security │ 100% Parameterized queries ($1..$N)     │
│ Error Handling    │ Sanitized error envelopes (no stack leak│
└───────────────────┴─────────────────────────────────────────┘
```

---

## 2. Ingestion Token Authentication

When the environment variable `LOG_INGESTION_TOKEN` is set, all calls to `POST /api/logs/ingest` must provide the token via:
- `x-ingestion-token: <secret_token>` header, or
- `Authorization: Bearer <secret_token>` header.

If missing or mismatched, the API returns HTTP 401:
```json
{
  "success": false,
  "message": "Unauthorized: Invalid or missing log ingestion token"
}
```

---

## 3. Dynamic CORS Protection

Configured in `backend/src/app.js`:
- Local development origins (`http://localhost:*`, `http://127.0.0.1:*`) are permitted automatically.
- Non-browser server-to-server requests (curl, Python collectors) without an `Origin` header are allowed.
- Production frontend origins defined in `CORS_ORIGIN` are whitelisted.
- Vercel preview environments matching `https://*.vercel.app` are dynamically authorized.
- Unauthorized browser origins receive HTTP 403 Forbidden with security logging.

---

## 4. SQL Injection Immunity

Every single database operation across SentinelX uses PostgreSQL parameterized queries (`$1, $2, ...`). No dynamic SQL string interpolation exists in any route, controller, or service.
