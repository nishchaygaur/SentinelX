const pool = require("../config/db");
const { createRandomSimulatedIncident } = require("../services/randomIncidentService");

const INCIDENT_SEVERITIES = new Set(["low", "medium", "high", "critical"]);

const getIncidentDetailsFromAlert = alert => {
    const severity = INCIDENT_SEVERITIES.has(String(alert.severity).toLowerCase())
        ? String(alert.severity).toLowerCase()
        : "medium";

    const minimumPriority = {
        critical: 90,
        high: 70,
        medium: 40,
        low: 10
    }[severity];
    const riskScore = Number(alert.risk_score);
    const priority = Number.isFinite(riskScore)
        ? Math.max(minimumPriority, Math.min(100, riskScore))
        : minimumPriority;

    return { severity, priority };
};

/*
 * Creates the initial incident for a qualifying alert. This intentionally uses
 * one incident per alert: broader alert correlation can be added later without
 * changing the existing incident retrieval API.
 */
const createIncidentForAlert = async alert => {
    const severity = String(alert.severity || "").toLowerCase();

    if (severity !== "high" && severity !== "critical") {
        return { created: false, reason: "severity_below_incident_threshold" };
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Serialise creation for this alert when detection is run concurrently.
        await client.query(
            "SELECT pg_advisory_xact_lock(hashtext($1))",
            [String(alert.id)]
        );

        const existingLink = await client.query(
            `
            SELECT incident_id
            FROM incident_alerts
            WHERE alert_id = $1
            LIMIT 1
            `,
            [alert.id]
        );

        if (existingLink.rows.length > 0) {
            await client.query("COMMIT");
            return {
                created: false,
                incidentId: existingLink.rows[0].incident_id,
                reason: "already_linked"
            };
        }

        const { severity: incidentSeverity, priority } = getIncidentDetailsFromAlert(alert);
        const incidentTitle = `Incident: ${alert.title || "Security alert"}`.slice(0, 255);
        const incidentDescription = alert.description ||
            `Automatically created from alert ${alert.id} (${alert.detection_rule || alert.alert_type || "security detection"}).`;

        const incidentResult = await client.query(
            `
            INSERT INTO incidents (title, description, severity, status, priority)
            VALUES ($1, $2, $3, 'open', $4)
            RETURNING id
            `,
            [incidentTitle, incidentDescription, incidentSeverity, priority]
        );

        const incidentId = incidentResult.rows[0].id;

        await client.query(
            `
            INSERT INTO incident_alerts (incident_id, alert_id)
            VALUES ($1, $2)
            ON CONFLICT (incident_id, alert_id) DO NOTHING
            `,
            [incidentId, alert.id]
        );

        // Record initial incident creation in incident_timeline
        await client.query(
            `
            INSERT INTO incident_timeline
                (incident_id, event_type, event_title, event_description, severity, status, reference_id, event_time)
            VALUES
                ($1, 'incident', 'Incident created', $2, $3, 'open', $1, CURRENT_TIMESTAMP)
            `,
            [incidentId, incidentDescription, incidentSeverity]
        );

        await client.query("COMMIT");
        return { created: true, incidentId };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

const getIncidents = async (req, res) => {
    try {
        const result = await pool.query(`
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
                i.closed_at,
                COUNT(ia.alert_id)::int AS alert_count
            FROM incidents i
            LEFT JOIN incident_alerts ia
                ON i.id = ia.incident_id
            GROUP BY i.id
            ORDER BY i.id DESC
        `);

        res.status(200).json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });
    } catch (error) {
        console.error("Error fetching incidents:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch incidents"
        });
    }
};

const getIncidentById = async (req, res) => {
    try {
        const { id } = req.params;

        const incidentResult = await pool.query(
            `
            SELECT
                id,
                title,
                description,
                severity,
                status,
                priority,
                assigned_to,
                investigation_notes,
                opened_at,
                updated_at,
                closed_at
            FROM incidents
            WHERE id = $1
            `,
            [id]
        );

        if (incidentResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Incident not found"
            });
        }

        const alertsResult = await pool.query(
            `
            SELECT
                a.id,
                a.alert_type,
                a.severity,
                a.title,
                a.detection_rule,
                a.status,
                a.risk_score,
                a.detected_at
            FROM alerts a
            JOIN incident_alerts ia
                ON a.id = ia.alert_id
            WHERE ia.incident_id = $1
            ORDER BY a.id
            `,
            [id]
        );

        const responsesResult = await pool.query(
            `
            SELECT
                id,
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
            const mitreResult = await pool.query(
        `
        SELECT
            m.id,
            m.alert_id,
            m.tactic_id,
            m.tactic_name,
            m.technique_id,
            m.technique_name,
            m.description
        FROM mitre_attack m
        JOIN incident_alerts ia
            ON ia.alert_id = m.alert_id
        WHERE ia.incident_id = $1
        ORDER BY m.id
        `,
        [id]
    );

    const threatIntelResult = await pool.query(
        `
        SELECT
            t.id,
            t.alert_id,
            t.indicator_type,
            t.indicator_value,
            t.threat_type,
            t.threat_name,
            t.source,
            t.reputation,
            t.confidence,
            t.description,
            t.raw_data
        FROM threat_intelligence t
        JOIN incident_alerts ia
            ON ia.alert_id = t.alert_id
        WHERE ia.incident_id = $1
        ORDER BY t.id
        `,
        [id]
    );

    const logsResult = await pool.query(
        `
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
        JOIN alerts a
            ON a.log_id = n.id
        JOIN incident_alerts ia
            ON ia.alert_id = a.id
        LEFT JOIN log_sources l
            ON n.source_id = l.id
        WHERE ia.incident_id = $1
        ORDER BY n.id
        `,
        [id]
    );
            res.status(200).json({
        success: true,
        data: {
            incident: incidentResult.rows[0],
            alerts: alertsResult.rows,
            logs: logsResult.rows,
            mitre_attack: mitreResult.rows,
            threat_intelligence: threatIntelResult.rows,
            response_actions: responsesResult.rows
        }
    });
    } catch (error) {
        console.error("Error fetching incident:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch incident"
        });
    }
};

const updateIncidentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const allowedStatuses = [
            "open",
            "investigating",
            "containment",
            "remediation",
            "resolved"
        ];

        if (!status || !allowedStatuses.includes(String(status).toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Allowed statuses: ${allowedStatuses.join(", ")}`
            });
        }

        const normalizedStatus = String(status).toLowerCase();

        const incidentResult = await pool.query(
            `
            SELECT id, status
            FROM incidents
            WHERE id = $1
            `,
            [id]
        );

        if (incidentResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Incident not found"
            });
        }

        const closedAt = normalizedStatus === "resolved" ? new Date() : null;

        const result = await pool.query(
            `
            UPDATE incidents
            SET
                status = $1,
                updated_at = CURRENT_TIMESTAMP,
                closed_at = $3
            WHERE id = $2
            RETURNING
                id,
                title,
                description,
                severity,
                status,
                priority,
                assigned_to,
                investigation_notes,
                opened_at,
                updated_at,
                closed_at
            `,
            [normalizedStatus, id, closedAt]
        );

        // Record status change in incident timeline
await pool.query(
    `
    INSERT INTO incident_timeline
        (incident_id, event_type, event_title, event_description, severity, status, reference_id)
    VALUES
        ($1, 'incident', $2, $3, $4, $5, $1)
    `,
    [
        id,
        `Incident status changed to ${normalizedStatus}`,
        `Incident status transitioned from ${incidentResult.rows[0].status} to ${normalizedStatus}.`,
        result.rows[0].severity,
        normalizedStatus
    ]
);

res.status(200).json({
    success: true,
    message: "Incident status updated successfully",
    data: result.rows[0]
});
    } catch (error) {
        console.error("Error updating incident status:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to update incident status"
        });
    }
};

//
const updateIncidentDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const { assigned_to, investigation_notes } = req.body;

        const incidentResult = await pool.query(
            `
            SELECT id
            FROM incidents
            WHERE id = $1
            `,
            [id]
        );

        if (incidentResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Incident not found"
            });
        }

        const result = await pool.query(
            `
            UPDATE incidents
            SET
                assigned_to = $1,
                investigation_notes = $2,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING
                id,
                title,
                description,
                severity,
                status,
                priority,
                assigned_to,
                investigation_notes,
                opened_at,
                updated_at,
                closed_at
            `,
            [
                assigned_to || null,
                investigation_notes || null,
                id
            ]
        );

        if (investigation_notes && investigation_notes.trim()) {
            await pool.query(
                `
                INSERT INTO incident_timeline
                    (incident_id, event_type, event_title, event_description, severity, status, reference_id, event_time)
                VALUES
                    ($1, 'investigation', 'Investigation note updated', $2, $3, $4, $1, CURRENT_TIMESTAMP)
                `,
                [
                    id,
                    investigation_notes.trim().slice(0, 500),
                    result.rows[0].severity,
                    result.rows[0].status
                ]
            );
        }

        res.status(200).json({
            success: true,
            message: "Incident details updated successfully",
            data: result.rows[0]
        });
    } catch (error) {
        console.error("Error updating incident details:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to update incident details"
        });
    }
};

//=======================================
// Custom Incident Timeline Entry
// POST /api/incidents/:id/timeline
//=======================================
const addIncidentTimelineEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const incidentId = Number(id);
        const { event_type, event_title, event_description, severity, status } = req.body;

        if (!Number.isInteger(incidentId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid incident ID"
            });
        }

        if (!event_title || typeof event_title !== "string" || !event_title.trim()) {
            return res.status(400).json({
                success: false,
                message: "event_title is required"
            });
        }

        const incidentResult = await pool.query(
            "SELECT id, severity, status FROM incidents WHERE id = $1",
            [incidentId]
        );

        if (incidentResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Incident not found"
            });
        }

        const incident = incidentResult.rows[0];

        const result = await pool.query(
            `
            INSERT INTO incident_timeline
                (incident_id, event_type, event_title, event_description, severity, status, reference_id, event_time)
            VALUES
                ($1, $2, $3, $4, $5, $6, $1, CURRENT_TIMESTAMP)
            RETURNING *
            `,
            [
                incidentId,
                event_type || "investigation",
                event_title.trim(),
                event_description ? String(event_description).trim() : null,
                severity || incident.severity,
                status || incident.status
            ]
        );

        res.status(201).json({
            success: true,
            message: "Timeline event added successfully",
            event: result.rows[0],
            data: result.rows[0]
        });
    } catch (error) {
        console.error("Error adding incident timeline event:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to add incident timeline event"
        });
    }
};

//=======================================
//get incident timeline 
//=======================================
const getIncidentTimeline = async (req, res) => {
    try {
        const { id } = req.params;
        const incidentId = Number(id);

        if (!Number.isInteger(incidentId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid incident ID"
            });
        }

        const incidentResult = await pool.query(
            `
            SELECT
                id,
                title,
                status,
                severity,
                priority,
                opened_at,
                updated_at,
                closed_at
            FROM incidents
            WHERE id = $1
            `,
            [incidentId]
        );

        if (incidentResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Incident not found"
            });
        }

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
        JOIN incident_alerts ia
            ON a.id = ia.alert_id
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
    [incidentId]
);
        res.status(200).json({
            success: true,
            timeline: timelineResult.rows,
            data: {
                incident: incidentResult.rows[0],
                timeline: timelineResult.rows
            }
        });

    } catch (error) {
        console.error(
            "Error fetching incident timeline:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Failed to fetch incident timeline"
        });
    }
};
const generateRandomIncident = async (req, res) => {
    try {
        const incident = await createRandomSimulatedIncident();

        res.status(201).json({
            success: true,
            message: "Random incident generated successfully",
            data: incident
        });
    } catch (error) {
        console.error("Error generating random incident:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to generate random incident"
        });
    }
};

module.exports = {
    getIncidents,
    getIncidentById,
    createIncidentForAlert,
    updateIncidentStatus,
    updateIncidentDetails,
    addIncidentTimelineEvent,
    getIncidentTimeline,
    generateRandomIncident
};
