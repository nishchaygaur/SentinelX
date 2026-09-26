# SentinelX — Incident Operations & Response Workflow

## 1. Incident Handling Standard Operating Procedure (SOP)

```
1. Ingestion & Detection: System triggers High/Critical alert.
2. Case Creation: Incident auto-created in 'open' status.
3. Triage & Assessment:
   - Analyst acknowledges alert.
   - Triggers AI Threat Copilot for Root Cause Analysis (RCA).
4. Investigation:
   - Review timeline, linked normalized logs, and MITRE techniques.
   - Update investigation notes and assign analyst.
5. Containment:
   - Create containment action (e.g. Block IP).
   - Execute response action and confirm timeline entry.
   - Update incident status to 'contained'.
6. Resolution & Closure:
   - Update status to 'resolved'.
   - Export executive PDF report for compliance record.
```
