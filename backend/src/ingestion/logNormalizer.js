/**
 * SentinelX Log Normalizer
 * Specialized parsers for the 5 official SentinelX log sources:
 * 1. Windows Event Logs
 * 2. Linux SSH Logs
 * 3. Web Server Logs
 * 4. Firewall Logs
 * 5. Application Logs
 */

const { normalizeIp, normalizePort, normalizeSeverity } = require("./logValidator");

/**
 * Normalizes Windows Event Logs
 * Supports Event IDs:
 * - 4625: Failed Logon
 * - 4624: Successful Logon
 * - 4688: Process Creation
 * - 7045: Service Installation
 */
function parseWindowsEventLog(rawMessage, defaultValues = {}) {
    const text = String(rawMessage || "");
    const normalized = {
        event_type: "windows_event",
        severity: "low",
        action: "info",
        username: defaultValues.username || null,
        hostname: defaultValues.hostname || null,
        source_ip: defaultValues.ip_address || null,
        destination_ip: null,
        source_port: null,
        destination_port: null,
        protocol: "RPC",
        message: text,
        normalized_data: {}
    };

    // Extract Event ID
    const eventIdMatch = text.match(/(?:Event\s*ID|EventId|ID)[\s:=]+(\d{4,5})/i);
    const eventId = eventIdMatch ? eventIdMatch[1] : null;
    if (eventId) normalized.normalized_data.event_id = eventId;

    // Extract Username / TargetUserName / Account Name
    const userMatch = text.match(/(?:Account\s*Name|TargetUserName|User\s*Name|User)[\s:=]+['"]?([A-Za-z0-9_@.-]+?)['"]?(?:[\s,;.()]|$)/i);
    if (userMatch && userMatch[1] && userMatch[1] !== "-") {
        normalized.username = userMatch[1].replace(/[.,;:]+$/, "");
    }

    // Extract Workstation / Hostname / Computer
    const hostMatch = text.match(/(?:Workstation\s*Name|Workstation|Computer\s*Name|Computer)[\s:=]+['"]?([A-Za-z0-9_.-]+?)['"]?(?:[\s,;.()]|$)/i);
    if (hostMatch && hostMatch[1] && hostMatch[1] !== "-") {
        normalized.hostname = hostMatch[1].replace(/[.,;:]+$/, "");
    }

    // Extract Source Network Address / IP
    const ipMatch = text.match(/(?:Source\s*Network\s*Address|Source\s*IP|IpAddress)[\s:=]+([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})/i);
    if (ipMatch && ipMatch[1]) {
        normalized.source_ip = normalizeIp(ipMatch[1]);
    }

    // Event ID specific normalization
    if (eventId === "4625" || text.toLowerCase().includes("an account failed to log on") || text.toLowerCase().includes("failed login")) {
        normalized.event_type = "failed_login";
        normalized.action = "failed_login";
        normalized.severity = "high";
    } else if (eventId === "4624" || text.toLowerCase().includes("an account was successfully logged on")) {
        normalized.event_type = "login";
        normalized.action = "successful_login";
        normalized.severity = "low";
    } else if (eventId === "4688" || text.toLowerCase().includes("a new process has been created")) {
        normalized.event_type = "process_creation";
        normalized.action = "process_created";

        const procMatch = text.match(/(?:New\s*Process\s*Name|Process\s*Name)[\s:=]+([^\r\n]+)/i);
        if (procMatch) normalized.normalized_data.process_name = procMatch[1].trim();

        // Check for malware/suspicious commands in process creation
        const lower = text.toLowerCase();
        if (lower.includes("mimikatz") || lower.includes("powershell -enc") || lower.includes("certutil -urlcache") || lower.includes("psexec") || lower.includes("nc.exe")) {
            normalized.event_type = "malware_indicator";
            normalized.severity = "critical";
        }
    } else if (eventId === "7045" || text.toLowerCase().includes("a service was installed in the system")) {
        normalized.event_type = "service_install";
        normalized.action = "service_installed";
        normalized.severity = "medium";
    }

    return normalized;
}

/**
 * Normalizes Linux SSH Logs
 * Supports:
 * - Failed password for (invalid user) <user> from <ip> port <port>
 * - Accepted password/publickey for <user> from <ip> port <port>
 * - Invalid user <user> from <ip>
 */
function parseLinuxSshLog(rawMessage, defaultValues = {}) {
    const text = String(rawMessage || "");
    const normalized = {
        event_type: "linux_ssh",
        severity: "low",
        action: "info",
        username: defaultValues.username || null,
        hostname: defaultValues.hostname || "linux-host",
        source_ip: defaultValues.ip_address || null,
        destination_ip: null,
        source_port: null,
        destination_port: 22,
        protocol: "SSH",
        message: text,
        normalized_data: {}
    };

    // Failed password
    const failedMatch = text.match(/Failed\s+(?:password|publickey)\s+for\s+(?:invalid\s+user\s+)?(\S+)\s+from\s+([0-9.]+)\s+port\s+(\d+)/i);
    if (failedMatch) {
        normalized.event_type = "failed_login";
        normalized.action = "failed_login";
        normalized.severity = "high";
        normalized.username = failedMatch[1];
        normalized.source_ip = normalizeIp(failedMatch[2]);
        normalized.source_port = normalizePort(failedMatch[3]);
        return normalized;
    }

    // Accepted password or publickey
    const acceptedMatch = text.match(/Accepted\s+(?:password|publickey)\s+for\s+(\S+)\s+from\s+([0-9.]+)\s+port\s+(\d+)/i);
    if (acceptedMatch) {
        normalized.event_type = "login";
        normalized.action = "successful_login";
        normalized.username = acceptedMatch[1];
        normalized.source_ip = normalizeIp(acceptedMatch[2]);
        normalized.source_port = normalizePort(acceptedMatch[3]);
        normalized.severity = (normalized.username === "root" || normalized.username === "admin") ? "medium" : "low";
        return normalized;
    }

    // Invalid user attempt
    const invalidUserMatch = text.match(/Invalid\s+user\s+(\S+)\s+from\s+([0-9.]+)/i);
    if (invalidUserMatch) {
        normalized.event_type = "failed_login";
        normalized.action = "invalid_user";
        normalized.severity = "high";
        normalized.username = invalidUserMatch[1];
        normalized.source_ip = normalizeIp(invalidUserMatch[2]);
        return normalized;
    }

    // Fallback extraction
    const ipMatch = text.match(/from\s+([0-9.]+)/i);
    if (ipMatch) normalized.source_ip = normalizeIp(ipMatch[1]);

    const portMatch = text.match(/port\s+(\d+)/i);
    if (portMatch) normalized.source_port = normalizePort(portMatch[1]);

    return normalized;
}

/**
 * Normalizes Web Server Logs
 * Supports:
 * - Common Log Format (CLF)
 * - Combined Log Format
 * - JSON access logs
 * Detects SQL injection, directory traversal, probe scans in requests
 */
function parseWebServerLog(rawMessage, defaultValues = {}) {
    const text = String(rawMessage || "");
    const normalized = {
        event_type: "http_request",
        severity: "low",
        action: "allow",
        username: defaultValues.username || null,
        hostname: defaultValues.hostname || "web-server",
        source_ip: defaultValues.ip_address || null,
        destination_ip: "10.0.0.5",
        source_port: null,
        destination_port: 80,
        protocol: "HTTP",
        message: text,
        normalized_data: {}
    };

    // Try Combined/Common Apache/Nginx format
    const clfRegex = /^(\S+)\s+\S+\s+(\S+)\s+\[([^\]]+)\]\s+"([A-Z]+)\s+([^ "]+)\s+HTTP\/[0-9.]+"\s+([0-9]{3})\s+(\S+)(?:\s+"([^"]*)"\s+"([^"]*)")?/i;
    const clfMatch = text.match(clfRegex);

    let method = null;
    let uri = null;
    let statusCode = null;

    if (clfMatch) {
        normalized.source_ip = normalizeIp(clfMatch[1]) || normalized.source_ip;
        if (clfMatch[2] !== "-") normalized.username = clfMatch[2];
        method = clfMatch[4];
        uri = clfMatch[5];
        statusCode = parseInt(clfMatch[6], 10);
        normalized.normalized_data.method = method;
        normalized.normalized_data.uri = uri;
        normalized.normalized_data.status_code = statusCode;
        if (clfMatch[8]) normalized.normalized_data.referer = clfMatch[8];
        if (clfMatch[9]) normalized.normalized_data.user_agent = clfMatch[9];
    } else {
        // Fallback extraction for ad-hoc web logs
        const methodMatch = text.match(/\b(GET|POST|PUT|DELETE|HEAD|OPTIONS|CONNECT)\s+([^\s"']+)/i);
        if (methodMatch) {
            method = methodMatch[1].toUpperCase();
            uri = methodMatch[2];
            normalized.normalized_data.method = method;
            normalized.normalized_data.uri = uri;
        }
        const ipMatch = text.match(/([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})/);
        if (ipMatch) normalized.source_ip = normalizeIp(ipMatch[1]);
    }

    const payload = `${uri || ""} ${text}`.toLowerCase();

    // Check for SQL injection patterns
    const sqlIndicators = [
        "union select",
        "union all select",
        "' or '1'='1",
        "or 1=1",
        "' or ''='",
        "information_schema",
        "drop table",
        "select * from",
        "--",
        "/*"
    ];

    const hasSqlInjection = sqlIndicators.some(ind => payload.includes(ind));
    if (hasSqlInjection || text.toLowerCase().includes("sql injection")) {
        normalized.event_type = "sql_injection";
        normalized.severity = "critical";
        normalized.action = "attack_detected";
        normalized.message = `SQL Injection attempt detected in HTTP request: ${uri || text.slice(0, 100)}`;
    } else if (payload.includes("/wp-admin") || payload.includes("/phpmyadmin") || payload.includes("/.env")) {
        normalized.event_type = "web_probe";
        normalized.severity = "medium";
        normalized.action = "suspicious_request";
    }

    return normalized;
}

/**
 * Normalizes Firewall Logs
 * Supports iptables, UFW, and general firewall structures
 * Extracts: SRC, DST, PROTO, SPT, DPT, ACTION
 */
function parseFirewallLog(rawMessage, defaultValues = {}) {
    const text = String(rawMessage || "");
    const normalized = {
        event_type: "firewall_traffic",
        severity: "low",
        action: "allow",
        username: null,
        hostname: defaultValues.hostname || "firewall-gw",
        source_ip: defaultValues.ip_address || null,
        destination_ip: null,
        source_port: null,
        destination_port: null,
        protocol: "TCP",
        message: text,
        normalized_data: {}
    };

    // Extract SRC
    const srcMatch = text.match(/\bSRC=([0-9.]+)/i);
    if (srcMatch) normalized.source_ip = normalizeIp(srcMatch[1]);

    // Extract DST
    const dstMatch = text.match(/\bDST=([0-9.]+)/i);
    if (dstMatch) normalized.destination_ip = normalizeIp(dstMatch[1]);

    // Extract PROTO
    const protoMatch = text.match(/\bPROTO=([A-Za-z0-9]+)/i);
    if (protoMatch) normalized.protocol = protoMatch[1].toUpperCase();

    // Extract SPT
    const sptMatch = text.match(/\bSPT=(\d+)/i);
    if (sptMatch) normalized.source_port = normalizePort(sptMatch[1]);

    // Extract DPT
    const dptMatch = text.match(/\bDPT=(\d+)/i);
    if (dptMatch) normalized.destination_port = normalizePort(dptMatch[1]);

    // Extract ACTION
    if (text.includes("DROP") || text.includes("BLOCK") || text.includes("[UFW BLOCK]")) {
        normalized.action = "drop";
        normalized.severity = "medium";
    } else if (text.includes("REJECT")) {
        normalized.action = "reject";
        normalized.severity = "medium";
    } else if (text.includes("ACCEPT") || text.includes("ALLOW")) {
        normalized.action = "allow";
        normalized.severity = "low";
    }

    // Check for scan indicator
    if (text.toLowerCase().includes("port scan") || text.toLowerCase().includes("scan detected")) {
        normalized.event_type = "port_scan";
        normalized.severity = "high";
    }

    return normalized;
}

/**
 * Normalizes Application Logs
 * Extracts application exceptions, security messages, SQL errors, malware indicators
 */
function parseApplicationLog(rawMessage, defaultValues = {}) {
    const text = String(rawMessage || "");
    const normalized = {
        event_type: "application",
        severity: "low",
        action: "info",
        username: defaultValues.username || null,
        hostname: defaultValues.hostname || "app-server",
        source_ip: defaultValues.ip_address || null,
        destination_ip: null,
        source_port: null,
        destination_port: null,
        protocol: "TCP",
        message: text,
        normalized_data: {}
    };

    const lower = text.toLowerCase();

    // Check log level brackets [ERROR], [CRITICAL], [WARN], etc.
    const levelMatch = text.match(/\[(CRITICAL|FATAL|ERROR|WARN|WARNING|INFO|DEBUG)\]/i);
    if (levelMatch) {
        normalized.severity = normalizeSeverity(levelMatch[1]);
    }

    // Check for SQL injection in application errors
    if (lower.includes("sql injection") || (lower.includes("syntax error") && lower.includes("union select"))) {
        normalized.event_type = "sql_injection";
        normalized.severity = "critical";
        normalized.action = "attack_detected";
    }
    // Check for malware indicators
    else if (lower.includes("mimikatz") || lower.includes("malware") || lower.includes("trojan") || lower.includes("ransomware") || lower.includes("webshell") || lower.includes(".locked")) {
        normalized.event_type = "malware_indicator";
        normalized.severity = "critical";
        normalized.action = "malware_alert";
    }
    // Check for authentication failures
    else if (lower.includes("authentication failure") || lower.includes("failed login") || lower.includes("login failed")) {
        normalized.event_type = "failed_login";
        normalized.action = "failed_login";
        normalized.severity = "high";
    }
    // Check for suspicious login
    else if (lower.includes("suspicious login") || (lower.includes("login") && lower.includes("suspicious"))) {
        normalized.event_type = "suspicious_login";
        normalized.action = "suspicious";
        normalized.severity = "high";
    }
    // Check for anomaly
    else if (lower.includes("anomalous") || lower.includes("unusual activity") || lower.includes("anomaly detected")) {
        normalized.event_type = "anomalous_activity";
        normalized.action = "anomalous";
        normalized.severity = "high";
    }

    // Try extracting IP if present
    const ipMatch = text.match(/([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})/);
    if (ipMatch && !normalized.source_ip) {
        normalized.source_ip = normalizeIp(ipMatch[1]);
    }

    // Try extracting username if present
    const userMatch = text.match(/(?:user|username|account)[\s:=]+['"]?([A-Za-z0-9_.-]+)['"]?/i);
    if (userMatch && userMatch[1] && !normalized.username) {
        normalized.username = userMatch[1];
    }

    return normalized;
}

/**
 * Universal dispatcher to normalize any raw log according to its source type.
 *
 * @param {object} sanitizedRawLog - Output from logValidator
 * @param {object} logSourceMetadata - Log source info from DB (e.g. source_type, name)
 * @returns {object} Full normalized log object ready for normalized_logs table insert
 */
function normalizeLog(sanitizedRawLog, logSourceMetadata = {}) {
    const sourceType = (logSourceMetadata.source_type || sanitizedRawLog.source_type || "application").toLowerCase();
    const rawMessage = sanitizedRawLog.raw_message || "";

    let parsed;
    switch (sourceType) {
        case "windows_event_log":
        case "windows_events":
        case "windows":
            parsed = parseWindowsEventLog(rawMessage, sanitizedRawLog);
            break;
        case "linux_ssh":
            parsed = parseLinuxSshLog(rawMessage, sanitizedRawLog);
            break;
        case "web_server":
            parsed = parseWebServerLog(rawMessage, sanitizedRawLog);
            break;
        case "firewall":
            parsed = parseFirewallLog(rawMessage, sanitizedRawLog);
            break;
        case "application":
        default:
            parsed = parseApplicationLog(rawMessage, sanitizedRawLog);
            break;
    }

    return {
        source_id: sanitizedRawLog.source_id || logSourceMetadata.id || null,
        event_time: sanitizedRawLog.timestamp || new Date().toISOString(),
        event_type: parsed.event_type,
        severity: normalizeSeverity(parsed.severity || sanitizedRawLog.severity),
        source_ip: parsed.source_ip || sanitizedRawLog.ip_address || null,
        destination_ip: parsed.destination_ip || null,
        source_port: parsed.source_port || null,
        destination_port: parsed.destination_port || null,
        username: parsed.username || sanitizedRawLog.username || null,
        hostname: parsed.hostname || sanitizedRawLog.hostname || null,
        protocol: parsed.protocol || "TCP",
        action: parsed.action || "allow",
        message: parsed.message || rawMessage,
        raw_log: rawMessage,
        normalized_data: {
            ...sanitizedRawLog.metadata,
            ...parsed.normalized_data,
            source_type: sourceType
        }
    };
}

module.exports = {
    normalizeLog,
    parseWindowsEventLog,
    parseLinuxSshLog,
    parseWebServerLog,
    parseFirewallLog,
    parseApplicationLog
};
