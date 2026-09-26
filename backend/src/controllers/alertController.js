const pool = require("../config/db");

const getAlerts = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                a.id,
                a.log_id,
                a.alert_type,
                a.severity,
                a.title,
                a.description,
                a.detection_rule,
                a.status,
                a.risk_score,
                a.detected_at,
                a.created_at,
                n.event_type,
                n.source_ip,
                n.destination_ip,
                n.username,
                l.name AS log_source
            FROM alerts a
            LEFT JOIN normalized_logs n
                ON a.log_id = n.id
            LEFT JOIN log_sources l
                ON n.source_id = l.id
            ORDER BY a.id DESC
        `);

        res.status(200).json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });
    } catch (error) {
        console.error("Error fetching alerts:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch alerts"
        });
    }
};
const updateAlertStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const allowedStatuses = [
            "new",
            "acknowledged",
            "investigating",
            "resolved"
        ];

        const normalizedStatus = String(status || "").toLowerCase();
        const alertId = Number(id);

        if (!allowedStatuses.includes(normalizedStatus)) {
            return res.status(400).json({
                success: false,
                message: "Invalid alert status",
                allowed_statuses: allowedStatuses
            });
        }

        if (!Number.isInteger(alertId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid alert ID"
            });
        }

        const result = await pool.query(
            `
            UPDATE alerts
            SET status = CAST($1 AS VARCHAR(30))
            WHERE id = CAST($2 AS BIGINT)
            RETURNING
                id,
                alert_type,
                severity,
                title,
                description,
                detection_rule,
                status,
                risk_score,
                detected_at,
                created_at
            `,
            [normalizedStatus, alertId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Alert not found"
            });
        }
        const incidentStatusMap = {
    new: "open",
    acknowledged: "investigating",
    investigating: "investigating",
    resolved: "resolved"
};

const incidentStatus = incidentStatusMap[normalizedStatus];

if (incidentStatus) {
    await pool.query(
        `
        UPDATE incidents
        SET
            status = CASE
                WHEN $1 = 'resolved' THEN 'resolved'
                WHEN status IN ('containment', 'remediation', 'resolved') THEN status
                ELSE $1
            END,
            updated_at = CURRENT_TIMESTAMP,
            closed_at = CASE
                WHEN $1 = 'resolved' THEN CURRENT_TIMESTAMP
                WHEN status = 'resolved' THEN closed_at
                ELSE NULL
            END
        WHERE id IN (
            SELECT incident_id
            FROM incident_alerts
            WHERE alert_id = $2
        )
        `,
        [incidentStatus, alertId]
    );
}
        res.status(200).json({
            success: true,
            message: "Alert status updated successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error(
            "Error updating alert status:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to update alert status"
        });
    }
};
module.exports = {
    getAlerts,
    updateAlertStatus
};