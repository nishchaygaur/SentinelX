/**
 * SentinelX Log Validator
 * Validates, sanitizes, and normalizes raw log payloads before ingestion.
 * Ensures malformed payloads never crash the pipeline while preserving partial valid data.
 */

const net = require("net");

const VALID_SEVERITIES = new Set(["low", "medium", "high", "critical"]);
const VALID_SOURCE_TYPES = new Set([
    "windows_event_log",
    "linux_ssh",
    "web_server",
    "firewall",
    "application"
]);

const SEVERITY_MAP = {
    debug: "low",
    info: "low",
    informational: "low",
    notice: "low",
    warn: "medium",
    warning: "medium",
    medium: "medium",
    err: "high",
    error: "high",
    high: "high",
    crit: "critical",
    critical: "critical",
    fatal: "critical",
    alert: "critical",
    emerg: "critical",
    emergency: "critical"
};

/**
 * Validates and normalizes IP address (IPv4 or IPv6).
 * Returns null if invalid.
 */
function normalizeIp(ip) {
    if (!ip || typeof ip !== "string") return null;
    const trimmed = ip.trim();
    return net.isIP(trimmed) ? trimmed : null;
}

/**
 * Validates port number (1 - 65535).
 * Returns integer or null.
 */
function normalizePort(port) {
    if (port === null || port === undefined || port === "") return null;
    const parsed = parseInt(port, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 65535) {
        return parsed;
    }
    return null;
}

/**
 * Parses and validates timestamps. Defaults to current date if missing or unparseable.
 */
function normalizeTimestamp(ts) {
    if (!ts) return new Date().toISOString();
    if (ts instanceof Date) return ts.toISOString();
    const parsed = new Date(ts);
    if (isNaN(parsed.getTime())) {
        return new Date().toISOString();
    }
    return parsed.toISOString();
}

/**
 * Normalizes severity to standard enum: low, medium, high, critical.
 */
function normalizeSeverity(sev) {
    if (!sev || typeof sev !== "string") return "low";
    const lower = sev.trim().toLowerCase();
    return SEVERITY_MAP[lower] || "low";
}

/**
 * Validates a single incoming log entry.
 *
 * @param {object} logEntry - Raw log payload object
 * @returns {object} { isValid: boolean, errors: string[], sanitized: object }
 */
function validateLog(logEntry) {
    const errors = [];

    if (!logEntry || typeof logEntry !== "object") {
        return {
            isValid: false,
            errors: ["Log entry must be an object"],
            sanitized: null
        };
    }

    // Raw message check
    const rawMessage = logEntry.raw_message || logEntry.message || logEntry.raw_log || "";
    if (typeof rawMessage !== "string" || rawMessage.trim().length === 0) {
        errors.push("Missing required field: raw_message or message");
    }

    // Maximum payload size check (500KB limit)
    if (rawMessage.length > 512000) {
        errors.push("Raw message exceeds maximum size of 500KB");
    }

    // Source type check
    let sourceType = logEntry.source_type || logEntry.source;
    if (sourceType && typeof sourceType === "string") {
        sourceType = sourceType.trim().toLowerCase();
    } else {
        sourceType = "application"; // fallback default
    }

    // Source ID
    let sourceId = logEntry.source_id ? parseInt(logEntry.source_id, 10) : null;
    if (sourceId !== null && isNaN(sourceId)) {
        sourceId = null;
    }

    // Build sanitized object with safe defaults
    const sanitized = {
        source_id: sourceId,
        source_type: sourceType,
        timestamp: normalizeTimestamp(logEntry.timestamp || logEntry.event_time),
        raw_message: String(rawMessage).trim(),
        hostname: logEntry.hostname ? String(logEntry.hostname).slice(0, 255) : null,
        ip_address: normalizeIp(logEntry.ip_address || logEntry.source_ip),
        username: logEntry.username ? String(logEntry.username).slice(0, 100) : null,
        severity: normalizeSeverity(logEntry.severity),
        metadata: (logEntry.metadata && typeof logEntry.metadata === "object") ? logEntry.metadata : {}
    };

    return {
        isValid: errors.length === 0,
        errors,
        sanitized
    };
}

module.exports = {
    validateLog,
    normalizeIp,
    normalizePort,
    normalizeTimestamp,
    normalizeSeverity,
    VALID_SEVERITIES,
    VALID_SOURCE_TYPES
};
