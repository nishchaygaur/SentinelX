# SentinelX — Dynamic Server-Side PDF Reporting

## 1. Overview

SentinelX generates pixel-perfect, publication-ready multi-page **Security Incident Reports** using **PDFKit** (`backend/src/services/pdfReportService.js`).

Endpoint: `GET /api/incidents/:id/report/pdf`

---

## 2. Report Sections

Every generated PDF includes:
1. **Executive Header Banner**: SentinelX brand pill, Incident ID, TLP:AMBER classification, and status badge.
2. **Incident Summary Grid**: Severity rating, priority index, assigned analyst, timestamp, and target hostname.
3. **Incident Narrative**: Detailed description and investigation notes.
4. **Triggering Alerts & Telemetry**: Table of linked alerts with risk scores, rules, and telemetry log snippets.
5. **MITRE ATT&CK Matrix**: Tactic names, technique identifiers, and defensive descriptions.
6. **Threat Intelligence IoCs**: Observed indicators, reputation assessments, and confidence ratings.
7. **AI Threat Copilot Assessment**: Root cause analysis, threat breakdown, and response playbook.
8. **Containment Response Actions**: Staged and completed response actions with execution timestamps.
9. **Chronological Audit Trail**: Full historical timeline of events.
10. **Executive Sign-off Footer**: Cryptographic document verification stamp and page numbering.
