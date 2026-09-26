# SentinelX — Supported Log Sources

SentinelX natively parses and normalizes 5 core log sources:

| Source Type | System / Protocol | Events Extracted |
|---|---|---|
| `windows_event_log` | Microsoft Windows Event Log / Sysmon | Event IDs 4625 (Logon Fail), 4624 (Logon Success), 4688 (Process Creation), 7045 (Service Install). |
| `linux_ssh` | OpenSSH daemon (`/var/log/auth.log`) | Failed password, Accepted publickey, Invalid user attempts. |
| `web_server` | Apache / Nginx / Reverse Proxies | Common Log Format (CLF), Combined format, SQL injection signatures in URIs. |
| `firewall` | iptables / UFW / Network Firewalls | Kernel dropped/rejected packet headers, SRC/DST IPs, SPT/DPT ports. |
| `application` | Custom Microservices & Enterprise Apps | Exception tracebacks, `[ERROR]`/`[CRITICAL]` tags, security anomalies. |
