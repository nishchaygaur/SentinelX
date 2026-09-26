# SentinelX — Command Line Interface Reference

## 1. Development & Build Commands

```bash
# Install all dependencies
npm --prefix backend install
npm --prefix frontend install

# Start backend server
npm --prefix backend start

# Start backend in development mode with nodemon
npm --prefix backend run dev

# Start frontend development server
npm --prefix frontend run dev

# Build frontend for production
npm --prefix frontend run build

# Lint frontend with Oxlint
npm --prefix frontend run lint
```

---

## 2. Database & Seeding Commands

```bash
# Execute idempotent database migrations
node database/migrate.js

# Populate authentic attack telemetry and seed alerts
node scripts/seed.js

# Replay attack logs in real time
node scripts/replayLogs.js --url http://localhost:5000/api --delay 200

# Replay attack logs in bulk batch mode
node scripts/replayLogs.js --url http://localhost:5000/api --batch
```

---

## 3. Testing & Verification Commands

```bash
# Run master test suite (detection, backend, e2e)
npm --prefix backend test

# Run 15-stage production verification audit
node tests/verify_audit.js

# Scan target file using YARA rules
node scripts/scanYara.js yara/rules/malware_rules.yar
```

---

## 4. Log Shipper Commands (Linux/Ubuntu)

```bash
# Test connection with single log line
./scripts/ubuntu_log_shipper.sh --url https://api.sentinelx.io/api --token "secret" --test

# Tail auth.log continuously
sudo ./scripts/ubuntu_log_shipper.sh --url https://api.sentinelx.io/api --token "secret" --tail

# Python 3 universal collector
python3 scripts/linux_collector.py --url https://api.sentinelx.io/api --token "secret" --test
```
