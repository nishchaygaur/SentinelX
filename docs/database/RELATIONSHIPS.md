# SentinelX — Database Relationships & Foreign Keys

## 1. Foreign Key Mappings

```
                     log_sources
                          ▲
                          │ ON DELETE SET NULL
                          │
  raw_logs          normalized_logs
                          ▲
                          │ ON DELETE SET NULL
                          │
                       alerts ◄────────────────┐
                       ▲   ▲                   │ ON DELETE CASCADE
    ON DELETE CASCADE  │   │ ON DELETE CASCADE │
┌──────────────────────┤   └───────────────────┼────────────────────┐
│                      │                       │                    │
mitre_attack   threat_intelligence      ai_analysis          incident_alerts
                                                                    ▲
                                                                    │ ON DELETE CASCADE
                                                                    │
                                                                incidents
                                                                ▲       ▲
                                              ON DELETE CASCADE │       │ ON DELETE CASCADE
                                                                │       │
                                               incident_timeline     response_actions
```

---

## 2. Cascade Behaviors

- Deleting an **Alert**: Automatically removes associated records in `mitre_attack`, `threat_intelligence`, `ai_analysis`, and junction entries in `incident_alerts`.
- Deleting an **Incident**: Automatically cascades deletion to its `incident_timeline`, `response_actions`, and junction mappings in `incident_alerts`.
- Deleting a **Normalized Log**: Sets `alerts.log_id` to `NULL` without destroying the alert record.
