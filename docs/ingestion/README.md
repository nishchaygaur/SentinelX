# SentinelX Ingestion Subsystem

## 1. Overview

The SentinelX Ingestion Subsystem collects security logs and authentication telemetry from remote endpoints and perimeter systems, validates payloads, persists immutable audit records, and distributes normalized events to the detection engine.

---

## 2. Ingestion Subsystem Components

1. **Remote Log Shippers**:
   - `scripts/ubuntu_log_shipper.sh`: Native Bash shipper for Linux/Ubuntu servers.
   - `scripts/linux_collector.py`: Standalone Python 3 shipper.
2. **Ingestion API**:
   - `POST /api/logs/ingest`: High-throughput JSON receiver.
3. **Validation & Normalization**:
   - `backend/src/ingestion/logValidator.js`: Schema sanitization and validation.
   - `backend/src/ingestion/logNormalizer.js`: 5 source parsers.
4. **Simulation & Replay**:
   - `scripts/replayLogs.js`: Live attack traffic replay engine.
