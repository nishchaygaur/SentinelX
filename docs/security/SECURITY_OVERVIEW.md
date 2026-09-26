# SentinelX Security Architecture Overview

## 1. Security Baseline

As a cybersecurity operations platform, SentinelX is engineered to high defensive standards:
1. **Parameterized Database Layer**: Zero SQL string interpolation.
2. **HTTP Hardening**: Helmet security headers configured on all Express endpoints.
3. **Dynamic CORS Whitelisting**: Strict origin validation.
4. **Token Authentication**: Header-based authentication on ingestion endpoints.
5. **Robust Input Validation**: Strict data typing and length sanitization on all ingestion inputs.
6. **Container Least-Privilege**: Dockerfile runs as non-root user `node`.
