const pool = require("../config/db");
const { generateIncidentReportPdf } = require("../services/pdfReportService");

const parseJsonField = (value) => {
    if (!value) {
        return [];
    }

    if (Array.isArray(value)) {
        return value;
    }

    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

/**
 * Fetches all consolidated incident data from PostgreSQL.
 */
const fetchIncidentReportData = async (id) => {
    // =========================================================
    // INCIDENT
    // =========================================================
    const incidentResult = await pool.query(
        `
        SELECT
            i.id,
            i.title,
            i.description,
            i.severity,
            i.status,
            i.priority,
            i.assigned_to,
            i.investigation_notes,
            i.opened_at,
            i.updated_at,
            i.closed_at
        FROM incidents i
        WHERE i.id = $1
        `,
        [id]
    );

    if (incidentResult.rows.length === 0) {
        return null;
    }

    const incident = incidentResult.rows[0];

    // =========================================================
    // ALERTS LINKED TO INCIDENT
    // =========================================================
    const alertResult = await pool.query(
        `
        SELECT
            a.*,
            n.event_type,
            n.source_ip,
            n.destination_ip,
            n.username,
            n.hostname,
            n.message,
            l.name AS log_source
        FROM incident_alerts ia
        JOIN alerts a
            ON ia.alert_id = a.id
        LEFT JOIN normalized_logs n
            ON a.log_id = n.id
        LEFT JOIN log_sources l
            ON n.source_id = l.id
        WHERE ia.incident_id = $1
        ORDER BY a.id
        `,
        [id]
    );

    const alertIds = alertResult.rows.map(alert => alert.id);

    let mitreRows = [];
    let threatIntelRows = [];
    let aiRows = [];

    // =========================================================
    // RELATED ALERT DATA
    // =========================================================
    if (alertIds.length > 0) {
        // =====================================================
        // MITRE ATT&CK
        // =====================================================
        const mitreResult = await pool.query(
            `
            SELECT
                alert_id,
                tactic_id,
                tactic_name,
                technique_id,
                technique_name,
                subtechnique_id,
                subtechnique_name,
                description
            FROM mitre_attack
            WHERE alert_id = ANY($1::bigint[])
            ORDER BY alert_id, id
            `,
            [alertIds]
        );

        mitreRows = mitreResult.rows;

        // =====================================================
        // THREAT INTELLIGENCE
        // =====================================================
        const threatIntelResult = await pool.query(
            `
            SELECT
                alert_id,
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
            WHERE alert_id = ANY($1::bigint[])
            ORDER BY alert_id, id
            `,
            [alertIds]
        );

        threatIntelRows = threatIntelResult.rows;

        // =====================================================
        // AI ANALYSIS (newest per alert)
        // =====================================================
        const aiResult = await pool.query(
            `
            SELECT DISTINCT ON (alert_id)
                id,
                alert_id,
                summary,
                threat_assessment,
                risk_explanation,
                investigation_steps,
                recommended_response,
                model_name,
                provider,
                created_at
            FROM ai_analysis
            WHERE alert_id = ANY($1::bigint[])
            ORDER BY alert_id, id DESC
            `,
            [alertIds]
        );

        aiRows = aiResult.rows.map(row => ({
            ...row,
            investigation_steps: parseJsonField(row.investigation_steps),
            recommended_response: parseJsonField(row.recommended_response)
        }));
    }

    // =========================================================
    // RESPONSE ACTIONS
    // =========================================================
    const responseResult = await pool.query(
        `
        SELECT
            id,
            incident_id,
            action_type,
            description,
            status,
            executed_by,
            execution_result,
            executed_at,
            created_at
        FROM response_actions
        WHERE incident_id = $1
        ORDER BY id
        `,
        [id]
    );

    // =========================================================
    // INCIDENT TIMELINE
    // =========================================================
    const timelineResult = await pool.query(
        `
        SELECT DISTINCT ON (event_time, event_type, reference_id, event_title)
            event_time,
            event_type,
            event_title,
            event_description,
            severity,
            status,
            reference_id
        FROM (
            SELECT
                a.detected_at AS event_time,
                'alert' AS event_type,
                'Alert detected' AS event_title,
                a.title AS event_description,
                a.severity,
                a.status,
                a.id AS reference_id
            FROM alerts a
            JOIN incident_alerts ia ON a.id = ia.alert_id
            WHERE ia.incident_id = $1

            UNION ALL

            SELECT
                i.opened_at AS event_time,
                'incident' AS event_type,
                'Incident created' AS event_title,
                i.description AS event_description,
                i.severity,
                i.status,
                i.id AS reference_id
            FROM incidents i
            WHERE i.id = $1

            UNION ALL

            SELECT
                COALESCE(ra.executed_at, ra.created_at) AS event_time,
                'response' AS event_type,
                ra.action_type AS event_title,
                ra.description AS event_description,
                NULL AS severity,
                ra.status,
                ra.id AS reference_id
            FROM response_actions ra
            WHERE ra.incident_id = $1

            UNION ALL

            SELECT
                it.event_time,
                it.event_type,
                it.event_title,
                it.event_description,
                it.severity,
                it.status,
                it.reference_id
            FROM incident_timeline it
            WHERE it.incident_id = $1
        ) timeline
        ORDER BY event_time ASC, reference_id ASC
        `,
        [id]
    );

    return {
        incident,
        alerts: alertResult.rows,
        mitre_attack: mitreRows,
        threat_intelligence: threatIntelRows,
        response_actions: responseResult.rows,
        ai_analysis: aiRows,
        timeline: timelineResult.rows
    };
};

/**
 * Returns incident report as JSON.
 */
const getIncidentReport = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await fetchIncidentReportData(id);

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Incident not found"
            });
        }

        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error("Error generating incident report:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to generate incident report"
        });
    }
};

/**
 * Generates and downloads incident report as a formatted PDF.
 */
const downloadIncidentReportPdf = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await fetchIncidentReportData(id);

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Incident not found"
            });
        }

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="SentinelX-Incident-${id}-Report.pdf"`
        );

        generateIncidentReportPdf(data, res);
    } catch (error) {
        console.error("Error generating incident PDF report:", error.message);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: "Failed to generate incident PDF report"
            });
        }
    }
};

module.exports = {
    getIncidentReport,
    downloadIncidentReportPdf,
    fetchIncidentReportData
};