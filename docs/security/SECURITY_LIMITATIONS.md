# SentinelX — Platform Security Boundaries & Limitations

## 1. Clear Security Boundaries

To maintain engineering integrity, the following boundaries are established:
- **Simulated Containment**: Response actions (e.g. Block IP, Isolate Host) update internal case tracking and database records; they do not manipulate production network equipment or kernel firewalls unless active orchestrators are configured.
- **Log Integrity**: SentinelX assumes the authenticity of logs delivered over TLS with the configured ingestion token; host-level log tampering prior to shipping must be prevented by OS-level audit protections (`auditd`, immutable append flags).
- **Network Scope**: SentinelX detects network attacks by parsing firewall drop events and web access logs; it does not perform raw promiscuous packet inspection or PCAP capture.
