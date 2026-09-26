# SentinelX — Security Headers Configuration

## 1. Helmet Middleware Configuration

SentinelX enforces security headers via `helmet()` in `backend/src/app.js` and in `frontend/vercel.json`:

### Key Headers Enforced:
- `X-Content-Type-Options: nosniff`: Prevents MIME-sniffing.
- `X-Frame-Options: DENY`: Prevents clickjacking.
- `X-XSS-Protection: 1; mode=block`: Legacy browser XSS filter.
- `Strict-Transport-Security`: Enforces HTTPS transport.
- `Content-Security-Policy`: Restricts unauthorized script injection.
