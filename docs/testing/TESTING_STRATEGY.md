# SentinelX — Testing Strategy

## 1. Defense-in-Depth Quality Model

```
┌─────────────────────────────────────────────────────────────┐
│                    TEST HARNESS PYRAMID                     │
├───────────────────┬─────────────────────────────────────────┤
│ Tier              │ Test Suite                              │
├───────────────────┼─────────────────────────────────────────┤
│ End-to-End        │ tests/e2e.test.js (11 stages)           │
│ Audit & Integrity │ tests/verify_audit.js (15 stages)       │
│ API Integration   │ tests/backend.test.js (17 assertions)   │
│ Detection Rules   │ tests/detection.test.js (12 assertions) │
│ Static Linting    │ Oxlint (0 errors, 0 warnings)           │
└───────────────────┴─────────────────────────────────────────┘
```

---

## 2. Core Testing Principles

- **Zero Mock Telemetry**: Tests run against real PostgreSQL schemas and live HTTP servers.
- **Positive & Negative Pairings**: Every detection rule must prove both positive trigger on malicious behavior and silence on benign operations.
- **Idempotency**: Test executions clean up their state or use ephemeral sequences, ensuring repeatable 100% pass rates.
