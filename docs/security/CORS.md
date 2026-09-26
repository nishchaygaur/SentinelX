# SentinelX — Cross-Origin Resource Sharing (CORS)

## 1. Origin Whitelisting Policy

Configured in `backend/src/app.js`:

```javascript
const isAllowedOrigin = (origin) => {
    if (!origin) return true; // Server-to-server, CLI, curl
    if (/^http:\/\/localhost(:\d+)?$/.test(origin)) return true;
    if (configuredOrigins.includes(origin)) return true;
    if (/^https:\/\/[a-zA-Z0-9_-]+\.vercel\.app$/.test(origin)) return true;
    return false;
};
```

---

## 2. Allowed Methods & Headers

- **Methods**: `GET`, `POST`, `PATCH`, `PUT`, `DELETE`, `OPTIONS`
- **Headers**: `Content-Type`, `Authorization`, `x-ingestion-token`, `X-Title`, `HTTP-Referer`
- **Credentials**: Allowed for authenticated sessions.
