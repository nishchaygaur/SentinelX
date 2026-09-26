const pool = require("../config/db");

const getAlertEnrichment = async (req, res) => {
    try {
        const { id } = req.params;

        const alertResult = await pool.query(
            `
            SELECT
                id,
                alert_type,
                severity,
                title,
                description,
                detection_rule,
                status,
                risk_score,
                detected_at
            FROM alerts
            WHERE id = $1
            `,
            [id]
        );

        if (alertResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Alert not found"
            });
        }

        const mitreResult = await pool.query(
            `
            SELECT
                tactic_id,
                tactic_name,
                technique_id,
                technique_name,
                subtechnique_id,
                subtechnique_name,
                description
            FROM mitre_attack
            WHERE alert_id = $1
            ORDER BY id
            `,
            [id]
        );

        const threatIntelResult = await pool.query(
            `
            SELECT
                indicator_type,
                indicator_value,
                threat_type,
                threat_name,
                source,
                reputation,
                confidence,
                description,
                first_seen,
                last_seen
            FROM threat_intelligence
            WHERE alert_id = $1
            ORDER BY id
            `,
            [id]
        );

        res.status(200).json({
            success: true,
            data: {
                alert: alertResult.rows[0],
                mitre_attack: mitreResult.rows,
                threat_intelligence: threatIntelResult.rows
            }
        });
    } catch (error) {
        console.error("Error fetching alert enrichment:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch alert enrichment"
        });
    }
};

module.exports = {
    getAlertEnrichment
};