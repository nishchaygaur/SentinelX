# SentinelX Backend Service

## 1. Overview

The SentinelX backend is a high-performance, modular Node.js 24 + Express 5 API service that acts as the core processing engine of the SentinelX platform.

It handles:
- Multi-source log ingestion & validation
- Modular log normalization
- Rule-based detection & sliding window correlation
- 5-factor deterministic risk scoring (0–100)
- MITRE ATT&CK tactic & technique mapping
- Threat intelligence indicator enrichment
- Incident lifecycle & chronological timeline management
- OpenRouter AI copilot threat analysis
- Simulated containment response actions
- Dynamic multi-page PDF incident report export
- Real-time SQL-aggregated SOC metrics

---

## 2. Directory Structure

```
backend/
├── Dockerfile                  # Container build with native YARA
├── package.json                # Dependencies and scripts
├── .env.example                # Configuration template
└── src/
    ├── app.js                  # Express middleware, CORS, and route mounting
    ├── server.js               # HTTP listener & process signal handling
    ├── config/
    │   ├── db.js               # PostgreSQL connection pool with cloud SSL
    │   └── detectionConfig.js  # Detection thresholds & regex patterns
    ├── controllers/            # Route business logic handlers
    ├── detection/              # 6 core detection algorithms
    ├── ingestion/              # Ingestion validator and 5 log parsers
    ├── routes/                 # Express router declarations
    └── services/               # Reusable business logic (AI, Risk, PDF, etc.)
```
