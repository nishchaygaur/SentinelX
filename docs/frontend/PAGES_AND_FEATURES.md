# SentinelX — Frontend Pages & Feature Walkthrough

## 1. Security Operations Views

### 1. Dashboard View
- **Summary Cards**:
  - Total Telemetry Ingested
  - Total Security Alerts
  - High-Priority Alerts
  - Active Incidents
  - Completed Containment Responses
  - Fleet Average Risk Score
- **Recent Activity Stream**: Live feed of latest alerts and incidents.

### 2. Alerts View
- Comprehensive table displaying Alert ID, Timestamp, Alert Title, Severity Badge, Rule Name, Risk Score Pill, and Triage Status Dropdown (`new`, `acknowledged`, `investigating`, `resolved`).

### 3. Incidents View
- Detailed incident cards with assigned analyst, opened timestamp, linked alerts count, and investigation notes.
- Click to load consolidated incident case.

### 4. Threat Intelligence View
- Filter indicators by type (`ip`, `domain`, `hash`, `cve`).
- Reputation scoring and confidence levels.

### 5. MITRE ATT&CK View
- Visual mapping of detected adversary behaviors to official MITRE matrix codes.

### 6. AI Threat Copilot View
- One-click triggers to dispatch alert telemetry to OpenRouter models.
- Structured display of executive summary, threat assessment, risk explanation, investigation checklist, and mitigation recommendations.

### 7. Containment Response View
- Manage incident containment actions. Execute pending actions with instant audit logging.

### 8. Incident Reports & PDF Export View
- Full consolidated incident dossier with one-click download of vector PDF report.

### 9. Normalized Logs View
- Searchable stream of normalized events with IP addresses, ports, protocols, and event types.

### 10. Documentation Explorer (`/docs`)
- Full-screen, responsive documentation library.
