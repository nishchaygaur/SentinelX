# SentinelX — Linux & Ubuntu Log Shipper Setup

## 1. Overview

SentinelX ingests real-time authentication, SSH, and system audit logs from remote Linux/Ubuntu VMs via:
1. `scripts/ubuntu_log_shipper.sh`: High-efficiency Bash shipper using `curl` and `jq`.
2. `scripts/linux_collector.py`: Universal Python 3 collector with no external dependencies.

---

## 2. Deploying `ubuntu_log_shipper.sh`

Copy the script to your Ubuntu server:

```bash
scp scripts/ubuntu_log_shipper.sh user@ubuntu-vm:/opt/sentinelx/
ssh user@ubuntu-vm
chmod +x /opt/sentinelx/ubuntu_log_shipper.sh
```

### Dependencies:
```bash
sudo apt-get update && sudo apt-get install -y curl jq
```

---

## 3. Running Ingestion Modes

### Mode A: Test Ingestion
Sends a single test failed password SSH log line to verify endpoint reachability:

```bash
/opt/sentinelx/ubuntu_log_shipper.sh   --url https://your-sentinelx-api.onrender.com/api   --token "your-secret-ingestion-token"   --test
```

### Mode B: Live Real-Time Tail
Tails `/var/log/auth.log` in real time, streaming SSH attempts directly into SentinelX:

```bash
sudo /opt/sentinelx/ubuntu_log_shipper.sh   --url https://your-sentinelx-api.onrender.com/api   --token "your-secret-ingestion-token"   --tail
```

---

## 4. Running as a Systemd Service

To run the shipper persistently across reboots:

Create `/etc/systemd/system/sentinelx-shipper.service`:

```ini
[Unit]
Description=SentinelX Ubuntu Security Log Shipper
After=network.target

[Service]
Type=simple
User=root
ExecStart=/opt/sentinelx/ubuntu_log_shipper.sh --url https://your-api.onrender.com/api --token "your-token" --tail
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now sentinelx-shipper
sudo systemctl status sentinelx-shipper
```
