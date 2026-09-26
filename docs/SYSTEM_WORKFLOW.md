# SentinelX — System Workflow & Data Lifecycle

## 1. High-Level Telemetry Flow

The SentinelX workflow transforms raw, unstructured, multi-source log telemetry into triaged alerts, correlated incident cases, and actionable response intelligence.

```mermaid
sequenceDiagram
    autonumber
    actor Attacker
    participant Target as Host / VM / Service
    participant Shipper as SentinelX Shipper (Bash/Python)
    participant API as Backend Ingestion API
    participant DB as PostgreSQL 17
    participant Engine as Detection Engine
    participant AI as OpenRouter AI
    actor Analyst as SOC Analyst

    Attacker->>Target: Launch attack (SSH brute force / SQLi / Port scan)
    Target->>Target: Log event to /var/log/auth.log or access.log
    Shipper->>Target: Read / tail event line
    Shipper->>API: POST /api/logs/ingest (with x-ingestion-token)
    API->>API: Validate & sanitize payload
    API->>DB: INSERT into raw_logs
    API->>API: Normalize log via source parser
    API->>DB: INSERT into normalized_logs
    
    Analyst->>API: POST /api/detection/run (or automatic cycle)
    API->>Engine: Run 6 detection rules across normalized_logs
    Engine->>Engine: Calculate Risk Score (0-100)
    Engine->>DB: INSERT into alerts
    Engine->>DB: Map MITRE ATT&CK & Threat Intel IoCs
    
    alt Alert Severity is High or Critical
        Engine->>DB: INSERT into incidents
        Engine->>DB: INSERT into incident_alerts & incident_timeline
    end
    
    Analyst->>API: GET /api/incidents/:id
    Analyst->>API: POST /api/ai/alerts/:id/analyze
    API->>AI: Send prompt with Alert, Log, MITRE, Threat Intel
    AI-->>API: Return structured JSON assessment
    API->>DB: Store in ai_analysis & incident_timeline
    
    Analyst->>API: POST /api/response-actions (Simulate containment)
    API->>DB: Record response action in incident_timeline
    Analyst->>API: GET /api/incidents/:id/report/pdf (Export executive report)
```

---

## 2. Telemetry Ingestion Stages

### Stage 1: Ingestion
- Shippers send HTTP POST requests with single or batch log entries to `/api/logs/ingest`.
- Authentication is verified using `x-ingestion-token`.

### Stage 2: Validation & Sanitization
- `logValidator.js` validates:
  - Source type validity (`windows_event_log`, `linux_ssh`, `web_server`, `firewall`, `application`).
  - IP address formatting (RFC 791 / RFC 4291).
  - Integer ports (`1–65535`).
  - Severity mapping.
- Unsanitized fields are stripped to prevent SQL injection or schema disruption.

### Stage 3: Normalization
- Universal dispatcher `normalizeLog()` invokes the designated source parser.
- Standardized fields extracted:
  - `event_time`, `event_type`, `severity`
  - `source_ip`, `destination_ip`, `source_port`, `destination_port`
  - `username`, `hostname`, `protocol`, `action`, `message`

---

## 3. Incident Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> NewAlert: Detection Triggered
    NewAlert --> Correlated: High/Critical Severity
    Correlated --> Open: Incident Created
    
    Open --> Investigating: Analyst Triage
    Investigating --> Contained: Response Action Executed
    Contained --> Resolved: Post-Incident Review Complete
    Resolved --> [*]
    
    Open --> Resolved: False Positive / Direct Close
```

### Status Definitions:
- **Alert Statuses**:
  - `new`: Freshly detected, awaiting analyst acknowledgment.
  - `acknowledged`: Analyst is aware of the alert.
  - `investigating`: Under active investigation.
  - `resolved`: Addressed or marked benign.
- **Incident Statuses**:
  - `open`: Correlated case awaiting triage.
  - `investigating`: Analyst assigned, notes added, AI investigation run.
  - `contained`: Containment response actions deployed (e.g. IP block, host isolation).
  - `resolved`: Incident closed with root cause documented.
