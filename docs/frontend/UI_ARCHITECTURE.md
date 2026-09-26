# SentinelX — Frontend UI Architecture

## 1. Component Hierarchy

```
App (Root)
│
├── Topbar
│   ├── SentinelX Brand & Status Badge
│   ├── Quick Ingestion Replay Trigger
│   ├── Generate Random Incident Button
│   ├── Docs Navigation Link (/docs)
│   └── Auto-Refresh Polling Control
│
├── Dashboard Layout (.dashboard-layout)
│   ├── Sidebar
│   │   ├── Navigation Tabs (Dashboard, Alerts, Incidents, Threat Intel, etc.)
│   │   ├── Active Alert Counter Badge
│   │   └── Active Incident Counter Badge
│   │
│   └── Main Content (.main-content)
│       ├── Connection Warning Banner (if API offline)
│       ├── DashboardView (Summary KPIs, Activity Feed, Charts)
│       ├── AlertsView (Filterable Alerts Table & Triage)
│       ├── IncidentsView (Incident Case Management & Triage)
│       ├── ThreatIntelView (IoC Indicator Browser)
│       ├── MitreView (ATT&CK Technique Matrix)
│       ├── AIView (OpenRouter Copilot Interface)
│       ├── ResponseView (Containment Action Simulation)
│       ├── ReportsView (Executive Report & PDF Generator)
│       └── LogsView (Real-time Normalized Telemetry Stream)
│
└── Sentinel Toast Notification System
```

---

## 2. Dedicated Documentation Layout (`/docs`)

When navigating to `/docs`, SentinelX renders a **dedicated full-browser documentation explorer** that is independent of the dashboard layout:
- The dashboard layout and dashboard sidebar are completely bypassed.
- The documentation UI uses its own responsive navigation sidebar, search engine, breadcrumbs, article table of contents, and back-to-console routing.
- This guarantees the dashboard sidebar never overlaps, hides, constrains, or covers the documentation.
