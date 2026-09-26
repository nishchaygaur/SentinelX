# SentinelX — Production Cloud Architecture

## 1. Architecture Topology

```
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│           Vercel                │       │           Ubuntu VM             │
│   React 19 + Vite 8 (SPA)       │       │    Security Log Shipper         │
│  https://<sentinelx>.vercel.app │       │  (auth.log / syslog stream)     │
└────────────────┬────────────────┘       └────────────────┬────────────────┘
                 │ HTTPS (REST API)                        │ HTTPS POST /api/logs/ingest
                 ▼                                         ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                                Render                                     │
│                     Node.js 24 + Express 5 Backend                        │
│                 https://<sentinelx-api>.onrender.com                      │
│                                                                           │
│  - Modular Detection & Normalization Engine                               │
│  - YARA 4.5.5 Malware Scanner Integration                                 │
│  - Health Checks (/health & /api/health)                                  │
│  - Graceful Shutdown & Ingestion Token Auth                               │
└─────────────────────┬───────────────────────────────┬─────────────────────┘
                       │ PostgreSQL (SSL Pooler)       │ AI Prompts / Completion
                       ▼                               ▼
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│          Supabase               │       │          OpenRouter             │
│   PostgreSQL 15/16/17 (Managed) │       │   AI Security Investigation     │
│   11 Relational Tables + Indexes│       │   (DeepSeek / Gemini / GPT-4o)  │
└─────────────────────────────────┘       └─────────────────────────────────┘
```
