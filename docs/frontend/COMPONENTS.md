# SentinelX — Frontend Components Catalog

## 1. Core Views & Components (`frontend/src/App.jsx`)

| Component | Role | Description |
|---|---|---|
| `Topbar` | Header | Global controls: live status, quick incident generator, documentation button, refresh. |
| `Sidebar` | Dashboard Nav | Primary navigation across the 9 SOC operational views. |
| `DashboardView`| Overview | Displays 7 dynamic KPIs: Total Logs, Alerts, Incidents, Completed Responses, Avg Risk Score. |
| `AlertsView` | Alert Triage | Table of detected security alerts with filter by severity and status updater. |
| `IncidentsView`| Case Management| Incident cases with severity badges, assigned analysts, and detailed view modals. |
| `ThreatIntelView`| Threat Intel | Displays IoC observables, reputation flags, and confidence ratings. |
| `MitreView` | ATT&CK Matrix | Interactive cards for tactics (Initial Access, Discovery, etc.) and techniques. |
| `AIView` | AI Copilot | Interface to trigger OpenRouter AI investigation, view RCA, and view playbooks. |
| `ResponseView` | Containment | Staging and executing simulated response actions with timeline confirmation. |
| `ReportsView` | Incident Report| Complete consolidated incident case report preview with one-click PDF download. |
| `LogsView` | Telemetry Feed | Real-time normalized security logs stream with source badges and payload previews. |
| `Select` | Input Widget | Custom-styled, accessible dropdown menu component. |
| `Toast` | Notifications | Floating notification alerts for background operations (seed, incident creation, PDF). |
