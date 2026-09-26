# SentinelX — Database Schema Reference

## 1. Complete Entity Relationship Model

```
┌─────────────────────────────────────────────────────────────┐
│                       DATABASE SCHEMA                       │
├───────────────────────┬─────────────────────────────────────┤
│ Table                 │ Primary Function                    │
├───────────────────────┼─────────────────────────────────────┤
│ schema_migrations     │ Migration version tracking          │
│ log_sources           │ Registered telemetry collectors     │
│ raw_logs              │ Immutable raw ingested log audit    │
│ normalized_logs       │ Structured security events          │
│ alerts                │ Detected security alert records     │
│ incidents             │ Correlated security case files      │
│ incident_alerts       │ Alert-to-incident M:N junction      │
│ incident_timeline     │ Chronological audit trail of events │
│ threat_intelligence   │ IoC indicator enrichments           │
│ mitre_attack          │ ATT&CK tactic & technique mappings  │
│ response_actions      │ Simulated containment actions       │
│ ai_analysis           │ OpenRouter AI threat assessments    │
└───────────────────────┴─────────────────────────────────────┘
```

---

## 2. Schema Definition Scripts

- Baseline DDL: `database/schema.sql`
- Incremental Migrations: `database/migrations/`
- Migration Execution Engine: `database/migrate.js`
