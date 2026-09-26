/**
 * SentinelX Ingestion Controller
 * Receives raw logs (single or batch), validates them, persists to raw_logs,
 * normalizes them according to source type, stores in normalized_logs,
 * and optionally runs detection.
 */

const pool = require("../config/db");
const { validateLog } = require("../ingestion/logValidator");
const { normalizeLog } = require("../ingestion/logNormalizer");

/**
 * Ingests single log or batch of logs.
 * POST /api/logs/ingest
 */
const ingestLogs = async (req, res) => {
    try {
        const payload = req.body;
        const entries = Array.isArray(payload) ? payload : [payload];

        if (entries.length === 0 || (entries.length === 1 && !entries[0])) {
            return res.status(400).json({
                success: false,
                message: "No log entries provided"
            });
        }

        // Security: If LOG_INGESTION_TOKEN is set in environment, enforce token authentication
        if (process.env.LOG_INGESTION_TOKEN) {
            const tokenHeader = req.headers["x-ingestion-token"] ||
                (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")
                    ? req.headers.authorization.slice(7)
                    : null);

            if (tokenHeader !== process.env.LOG_INGESTION_TOKEN) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized: Invalid or missing log ingestion token"
                });
            }
        }

        // Fetch known log sources from database for mapping
        const sourcesResult = await pool.query("SELECT id, name, source_type FROM log_sources");
        const sourcesByType = {};
        const sourcesById = {};
        for (const src of sourcesResult.rows) {
            sourcesByType[src.source_type.toLowerCase()] = src;
            sourcesById[src.id] = src;
        }

        const rawLogIds = [];
        const normalizedLogIds = [];
        const rejected = [];

        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            const validation = validateLog(entry);

            if (!validation.isValid) {
                rejected.push({
                    index: i,
                    errors: validation.errors,
                    entry
                });
                continue;
            }

            const sanitized = validation.sanitized;

            // Resolve log source
            let sourceMeta = null;
            if (sanitized.source_id && sourcesById[sanitized.source_id]) {
                sourceMeta = sourcesById[sanitized.source_id];
                sanitized.source_type = sourceMeta.source_type;
            } else if (sanitized.source_type && sourcesByType[sanitized.source_type]) {
                sourceMeta = sourcesByType[sanitized.source_type];
                sanitized.source_id = sourceMeta.id;
            } else {
                // Fallback to application log source (ID 5 by default)
                sourceMeta = sourcesByType["application"] || sourcesResult.rows[0] || { id: null, source_type: "application" };
                sanitized.source_id = sourceMeta.id;
            }

            // 1. Store Raw Log
            const rawInsert = await pool.query(
                `
                INSERT INTO raw_logs
                    (source_id, timestamp, raw_message, source_type, hostname, ip_address, username, severity, metadata)
                VALUES
                    ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING id
                `,
                [
                    sanitized.source_id,
                    sanitized.timestamp,
                    sanitized.raw_message,
                    sanitized.source_type,
                    sanitized.hostname,
                    sanitized.ip_address,
                    sanitized.username,
                    sanitized.severity,
                    JSON.stringify(sanitized.metadata)
                ]
            );
            const rawLogId = rawInsert.rows[0].id;
            rawLogIds.push(rawLogId);

            // 2. Normalize Log
            const normalized = normalizeLog(sanitized, sourceMeta);

            // 3. Store Normalized Log
            const normInsert = await pool.query(
                `
                INSERT INTO normalized_logs
                (
                    source_id, event_time, event_type, severity,
                    source_ip, destination_ip, source_port, destination_port,
                    username, hostname, protocol, action,
                    message, raw_log, normalized_data
                )
                VALUES
                (
                    $1, $2, $3, $4,
                    $5, $6, $7, $8,
                    $9, $10, $11, $12,
                    $13, $14, $15
                )
                RETURNING id
                `,
                [
                    normalized.source_id,
                    normalized.event_time,
                    normalized.event_type,
                    normalized.severity,
                    normalized.source_ip,
                    normalized.destination_ip,
                    normalized.source_port,
                    normalized.destination_port,
                    normalized.username,
                    normalized.hostname,
                    normalized.protocol,
                    normalized.action,
                    normalized.message,
                    normalized.raw_log,
                    JSON.stringify(normalized.normalized_data)
                ]
            );
            const normalizedLogId = normInsert.rows[0].id;
            normalizedLogIds.push(normalizedLogId);
        }

        // Optional auto-detection
        let detectionResults = null;
        const autoDetect = req.query.detect !== "false" && req.body.run_detection !== false;
        if (autoDetect && normalizedLogIds.length > 0) {
            try {
                const { executeDetectionEngine } = require("../detection/detectionRules");
                detectionResults = await executeDetectionEngine();
            } catch (detErr) {
                console.error("Auto-detection warning during ingestion:", detErr.message);
            }
        }

        res.status(201).json({
            success: true,
            message: `Ingested ${normalizedLogIds.length} logs successfully${rejected.length > 0 ? `, ${rejected.length} rejected` : ""}`,
            data: {
                accepted_count: normalizedLogIds.length,
                rejected_count: rejected.length,
                raw_log_ids: rawLogIds,
                normalized_log_ids: normalizedLogIds,
                detection_results: detectionResults,
                rejected
            }
        });
    } catch (error) {
        console.error("Log ingestion error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to ingest logs",
            error: error.message
        });
    }
};

/**
 * Gets raw logs with pagination.
 * GET /api/logs/raw
 */
const getRawLogs = async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit || "50", 10), 200);
        const offset = parseInt(req.query.offset || "0", 10);
        const sourceId = req.query.source_id ? parseInt(req.query.source_id, 10) : null;

        let query = `
            SELECT r.*, l.name AS source_name
            FROM raw_logs r
            LEFT JOIN log_sources l ON r.source_id = l.id
        `;
        const params = [];

        if (sourceId) {
            params.push(sourceId);
            query += ` WHERE r.source_id = $${params.length}`;
        }

        query += ` ORDER BY r.id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);
        const countResult = await pool.query("SELECT COUNT(*) FROM raw_logs");

        res.status(200).json({
            success: true,
            total: parseInt(countResult.rows[0].count, 10),
            count: result.rows.length,
            limit,
            offset,
            data: result.rows
        });
    } catch (error) {
        console.error("Error fetching raw logs:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch raw logs"
        });
    }
};

module.exports = {
    ingestLogs,
    getRawLogs
};
