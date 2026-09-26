# SentinelX — Ubuntu VM Log Shipper

## 1. Overview

The Ubuntu log shipper (`scripts/ubuntu_log_shipper.sh`) is an optimized POSIX Bash script utilizing `curl` and `jq` to ship system logs to SentinelX over HTTPS.

---

## 2. Usage Modes

### Mode 1: Single Verification Test (`--test`)
Synthesizes an authentic SSH failed authentication event to test endpoint reachability and token validation:
```bash
./ubuntu_log_shipper.sh --url https://api.sentinelx.io/api --token "secret" --test
```

### Mode 2: Real-Time Stream (`--tail`)
Executes `tail -F /var/log/auth.log`, filtering for SSH events (`sshd[`) and streaming each entry immediately:
```bash
sudo ./ubuntu_log_shipper.sh --url https://api.sentinelx.io/api --token "secret" --tail
```

---

## 3. Log Parsing Pipeline

When the shipper reads a line:
```text
Sep 26 14:10:15 srv-bastion sshd[14101]: Failed password for invalid user admin from 185.220.101.5 port 41201 ssh2
```
It encapsulates the line into a JSON payload:
```json
{
  "source_type": "linux_ssh",
  "raw_message": "Sep 26 14:10:15 srv-bastion sshd[14101]: Failed password for invalid user admin from 185.220.101.5 port 41201 ssh2"
}
```
