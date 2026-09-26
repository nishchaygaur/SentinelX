# SentinelX — Ingestion Pipeline Architecture

## 1. Flow Diagram

```mermaid
flowchart LR
    A[Raw Log Emitter] --> B[POST /api/logs/ingest]
    B --> C{Token Valid?}
    C -- No --> D[HTTP 401 Unauthorized]
    C -- Yes --> E[Log Validator]
    E --> F{Schema Valid?}
    F -- No --> G[Reject Entry & Log Warning]
    F -- Yes --> H[INSERT INTO raw_logs]
    H --> I[Log Normalizer Dispatcher]
    I --> J[Normalized Object Extraction]
    J --> K[INSERT INTO normalized_logs]
    K --> L[Detection Trigger Notification]
```

---

## 2. Ingestion Resilience

- **Fail-Safe Processing**: If an array of 50 logs contains 2 malformed entries, the 48 valid logs are processed and inserted, while the 2 malformed items are isolated into a `rejected` report without interrupting the transaction.
- **Backpressure & Limits**: Request body size limit set to 5 MB (`app.use(express.json({ limit: "5mb" }))`).
