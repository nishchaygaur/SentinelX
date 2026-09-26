# SentinelX Testing & Quality Assurance

## 1. Overview

SentinelX is tested through an exhaustive, multi-layered quality assurance harness:
1. **Detection Unit Tests** (`tests/detection.test.js`): Positive and negative validation of all 6 detection rules.
2. **Backend API Integration Tests** (`tests/backend.test.js`): HTTP contract validation across all Express routes.
3. **End-to-End Pipeline Tests** (`tests/e2e.test.js`): 11-stage trace from raw SSH log ingestion to PDF report generation.
4. **Master Verification Audit** (`tests/verify_audit.js`): 15-stage production compliance and schema integrity audit.
5. **Static Code Analysis**: Oxlint across all frontend and backend code.
6. **API Testing**: Postman collection at `docs/SentinelX.postman_collection.json`.
