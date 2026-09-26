const pool = require("../config/db");

const getNormalizedLogs = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                n.id,
                n.event_time,
                n.event_type,
                n.severity,
                n.source_ip,
                n.destination_ip,
                n.source_port,
                n.destination_port,
                n.username,
                n.hostname,
                n.protocol,
                n.action,
                n.message,
                n.raw_log,
                n.normalized_data,
                n.created_at,
                l.name AS log_source,
                l.source_type
            FROM normalized_logs n
            LEFT JOIN log_sources l
                ON n.source_id = l.id
            ORDER BY n.id DESC
        `);

        res.status(200).json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });
    } catch (error) {
        console.error(
            "Error fetching normalized logs:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Failed to fetch normalized logs"
        });
    }
};


const createNormalizedLog = async (req, res) => {
    try {
        const {
            source_id,
            event_time,
            event_type,
            severity,
            source_ip,
            destination_ip,
            source_port,
            destination_port,
            username,
            hostname,
            protocol,
            action,
            message,
            raw_log,
            normalized_data
        } = req.body;

        const result = await pool.query(
            `
            INSERT INTO normalized_logs (
                source_id,
                event_time,
                event_type,
                severity,
                source_ip,
                destination_ip,
                source_port,
                destination_port,
                username,
                hostname,
                protocol,
                action,
                message,
                raw_log,
                normalized_data
            )
            VALUES (
                $1,
                COALESCE($2, CURRENT_TIMESTAMP),
                $3,
                $4,
                $5,
                $6,
                $7,
                $8,
                $9,
                $10,
                $11,
                $12,
                $13,
                $14,
                $15
            )
            RETURNING *
            `,
            [
                source_id || null,
                event_time || null,
                event_type || null,
                severity || null,
                source_ip || null,
                destination_ip || null,
                source_port || null,
                destination_port || null,
                username || null,
                hostname || null,
                protocol || null,
                action || null,
                message || null,
                raw_log || null,
                normalized_data || {}
            ]
        );

        res.status(201).json({
            success: true,
            message: "Normalized log created successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error(
            "Error creating normalized log:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Failed to create normalized log"
        });
    }
};


module.exports = {
    getNormalizedLogs,
    createNormalizedLog
};