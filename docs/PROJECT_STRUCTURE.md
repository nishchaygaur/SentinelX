# SentinelX — Repository Project Structure

Below is an annotated map of the SentinelX repository files and modules:

```
SentinelX/
│
├── .env.example                 # Root environment template
├── .gitignore                   # Git exclusion rules
├── .dockerignore                # Docker build context exclusions
├── docker-compose.yml           # Full-stack multi-container composition
├── render.yaml                  # Render Infrastructure-as-Code blueprint
├── README.md                    # Repository README and quick-start guide
│
├── backend/                     # Express 5 Backend API service
│   ├── Dockerfile               # Production Dockerfile with YARA toolchain
│   ├── package.json             # Backend dependencies and test scripts
│   ├── .env.example             # Backend environment template
│   └── src/
│       ├── app.js               # Express application initialization & middleware
│       ├── server.js            # HTTP server listener and lifecycle hooks
│       ├── config/
│       │   ├── db.js            # PostgreSQL connection pool configuration
│       │   └── detectionConfig.js# Detection rule thresholds and regex patterns
│       ├── controllers/
│       │   ├── aiController.js           # AI alert analysis handler
│       │   ├── alertController.js        # Alerts retrieval and status update
│       │   ├── dashboardController.js    # Live SQL dashboard aggregation
│       │   ├── detectionController.js    # Manual & automated detection runner
│       │   ├── enrichmentController.js   # MITRE ATT&CK & threat intel handler
│       │   ├── incidentController.js     # Incident CRUD & timeline operations
│       │   ├── ingestionController.js    # Raw log validation and ingestion
│       │   ├── logSourceController.js    # Log source registry handler
│       │   ├── normalizedLogController.js# Normalized log retrieval
│       │   ├── reportController.js       # JSON and PDF report handlers
│       │   └── responseActionController.js# Containment action execution
│       ├── detection/
│       │   └── detectionRules.js         # 6 core detection algorithms
│       ├── ingestion/
│       │   ├── logNormalizer.js          # 5-source telemetry parsers
│       │   └── logValidator.js           # Input validation and sanitization
│       ├── routes/                       # Express router definitions
│       └── services/
│           ├── aiService.js              # OpenRouter API client
│           ├── mitreService.js           # MITRE ATT&CK technique mapper
│           ├── pdfReportService.js       # Vector PDF incident report builder
│           ├── randomIncidentService.js  # Synthetic incident generator
│           ├── riskScoringService.js     # 0-100 explainable risk algorithm
│           └── threatIntelService.js     # IoC reputation enrichment engine
│
├── database/                    # Database migrations and baseline schema
│   ├── migrate.js               # Idempotent database migration runner
│   ├── schema.sql               # Authoritative baseline schema definition
│   └── migrations/              # Incremental SQL migration scripts
│       ├── 001_create_raw_logs.sql
│       ├── 002_create_ai_security_analysis_view.sql
│       └── 003_add_cascade_to_alert_foreign_keys.sql
│
├── frontend/                    # React 19 + Vite 8 SPA
│   ├── index.html               # Web application entry HTML
│   ├── package.json             # Frontend dependencies & Oxlint config
│   ├── vite.config.js           # Vite development and build settings
│   ├── vercel.json              # Vercel SPA routing and security headers
│   └── src/
│       ├── main.jsx             # React DOM root hydration
│       ├── App.jsx              # Main application layout, state & views
│       ├── App.css              # SOC styling system and tokens
│       ├── index.css            # Base stylesheet reset
│       └── components/          # Reusable UI widgets
│
├── docs/                        # Complete Technical Documentation Library
│   ├── README.md                # Docs index and navigation guide
│   ├── setup/                   # Setup guides for all platforms
│   ├── backend/                 # Backend API and service documentation
│   ├── frontend/                # Frontend UI and component documentation
│   ├── database/                # Schema, tables, and query documentation
│   ├── ingestion/               # Log collectors and shippers
│   ├── deployment/              # Vercel, Render, Supabase guides
│   ├── testing/                 # Master test suite and audit reports
│   ├── security/                # Security headers, CORS, and boundaries
│   ├── operations/              # Runbooks, monitoring, troubleshooting
│   ├── diagrams/                # Mermaid diagrams and workflows
│   └── reference/               # Glossary, commands, error codes
│
├── scripts/                     # Operational automation scripts
│   ├── linux_collector.py       # Python 3 Linux security log collector
│   ├── replayLogs.js            # Telemetry replay simulation engine
│   ├── scanYara.js              # YARA malware scan utility
│   ├── seed.js                  # Deterministic database seeder
│   └── ubuntu_log_shipper.sh    # Ubuntu VM auth.log shipper script
│
├── tests/                       # Automated test suites
│   ├── backend.test.js          # Express API route integration tests
│   ├── detection.test.js        # Detection rule unit tests (positive/negative)
│   ├── e2e.test.js              # 11-stage end-to-end pipeline test
│   ├── runAllTests.js           # Master test runner
│   └── verify_audit.js          # 15-stage production verification audit
│
└── yara/                        # YARA signature engine
    └── rules/
        └── malware_rules.yar    # Malware, webshell, and ransomware signatures
```
`
