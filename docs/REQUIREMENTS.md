# SentinelX — System Requirements

## 1. Runtime & Environment Prerequisites

| Component | Minimum Version | Recommended Version | Purpose |
|---|---|---|---|
| **Node.js** | v20.18.0 LTS | v24.19.0 LTS | Backend runtime and frontend toolchain. |
| **npm** | v10.0.0 | v10.9.0 | Package dependency manager. |
| **PostgreSQL** | v15.0 | v17.2 / Supabase | Relational database storage. |
| **YARA** | v4.2.0 | v4.5.5 | Malware signature scanning engine. |
| **Python** | v3.8 | v3.11+ | Linux telemetry collection script (`linux_collector.py`). |
| **cURL & jq** | Latest | Latest | Ubuntu log shipping script (`ubuntu_log_shipper.sh`). |
| **Web Browser** | Chrome 110+, Firefox 110+, Safari 16+, Edge 110+ | Latest Evergreen | React 19 Frontend UI. |

---

## 2. Hardware Resource Sizing

### Development & Evaluation
- **CPU**: 2 Cores (x86_64 or ARM64)
- **RAM**: 4 GB RAM minimum
- **Disk**: 1 GB available storage for database and log replay

### Production Deployment
- **Backend Service (Render)**: 512 MB – 1 GB RAM, 0.5 – 1 CPU Core
- **Database (Supabase)**: Micro / Small instance with connection pooler enabled
- **Frontend (Vercel)**: Serverless static Edge distribution
- **Log Volume Throughput**: Tested up to 10,000 logs/min with batch insertion

---

## 3. Network & Security Requirements

1. **Inbound HTTP Ports**:
   - Backend API: Port `5000` (development) / `10000` or standard HTTPS `443` (Render).
   - Frontend: Port `5173` (development) / standard HTTPS `443` (Vercel).
   - PostgreSQL: Port `5432` (direct) or `6543` (Supabase transaction pooler).
2. **Outbound Internet Access**:
   - Access to `https://openrouter.ai/api/v1` for AI threat investigation.
   - Outbound access to Supabase database host via SSL.
3. **CORS Rules**:
   - Backend must whitelist the frontend domain via `CORS_ORIGIN`.
