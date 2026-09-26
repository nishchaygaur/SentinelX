# SentinelX — End-to-End Pipeline Testing

## 1. 11-Stage Pipeline Test (`tests/e2e.test.js`)

The end-to-end pipeline test traces a complete security telemetry lifecycle:

- **Stage 1**: Ingests 6 raw Linux SSH failed login logs from `192.168.100.113`.
- **Stage 2**: Executes detection engine over normalized logs.
- **Stage 3**: Queries `alerts` to confirm generated Brute Force alert.
- **Stage 4**: Validates MITRE ATT&CK T1110 and Threat Intel enrichment.
- **Stage 5**: Verifies automated incident creation for High/Critical alert.
- **Stage 6**: Updates incident status to `investigating`.
- **Stage 7**: Updates investigation notes and assigns analyst.
- **Stage 8**: Creates and executes simulated containment action (`Block IP`).
- **Stage 9**: Verifies complete incident timeline audit trail.
- **Stage 10**: Validates consolidated incident report payload.
- **Stage 11**: Verifies dynamic SOC dashboard calculations.
