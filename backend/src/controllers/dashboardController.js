const pool = require("../config/db");

const getDashboardSummary = async (req, res) => {
    try {
        const summaryResult = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM normalized_logs) AS total_logs,
                (SELECT COUNT(*) FROM alerts) AS total_alerts,
                (SELECT COUNT(*) FROM alerts
                    WHERE severity IN ('high', 'critical')) AS high_priority_alerts,
                (SELECT COUNT(*) FROM incidents
                    WHERE status = 'open') AS open_incidents,
                (SELECT COUNT(*) FROM incidents) AS total_incidents,
                (SELECT COUNT(*) FROM response_actions
                    WHERE status = 'completed') AS completed_responses,
                COALESCE(
                    (SELECT ROUND(AVG(risk_score), 2) FROM alerts),
                    0
                ) AS average_risk_score
        `);

        const alertSeverityResult = await pool.query(`
            SELECT
                severity,
                COUNT(*)::int AS count
            FROM alerts
            GROUP BY severity
            ORDER BY
                CASE severity
                    WHEN 'critical' THEN 1
                    WHEN 'high' THEN 2
                    WHEN 'medium' THEN 3
                    WHEN 'low' THEN 4
                    ELSE 5
                END
        `);

        const incidentSeverityResult = await pool.query(`
            SELECT
                severity,
                COUNT(*)::int AS count
            FROM incidents
            GROUP BY severity
            ORDER BY
                CASE severity
                    WHEN 'critical' THEN 1
                    WHEN 'high' THEN 2
                    WHEN 'medium' THEN 3
                    WHEN 'low' THEN 4
                    ELSE 5
                END
        `);

        res.status(200).json({
            success: true,
            data: {
                ...summaryResult.rows[0],
                summary: summaryResult.rows[0],
                alert_severity: alertSeverityResult.rows,
                incident_severity: incidentSeverityResult.rows
            }
        });
    } catch (error) {
        console.error("Error fetching dashboard summary:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard summary"
        });
    }
};

module.exports = {
    getDashboardSummary
};