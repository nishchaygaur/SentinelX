# SentinelX — Linux Log Collection Architecture

## 1. Linux Telemetry Sources

SentinelX monitors Linux security telemetry by capturing:
- `/var/log/auth.log` (Debian / Ubuntu): Failed/accepted SSH logins, sudo escalations, invalid user attempts.
- `/var/log/secure` (RHEL / CentOS / Rocky): Equivalent authentication events.
- `/var/log/syslog` / systemd journal: Critical daemon anomalies.

---

## 2. Standalone Python Collector (`scripts/linux_collector.py`)

A lightweight Python 3 daemon requiring no pip packages or third-party dependencies:

```bash
# Test single event delivery
python3 scripts/linux_collector.py --url https://your-api.onrender.com/api --test

# Run with authentication token
python3 scripts/linux_collector.py   --url https://your-api.onrender.com/api   --token "your-secret-token"   --test
```
