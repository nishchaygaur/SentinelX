const pool = require("../config/db");

const getResponseActions = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                r.id,
                r.incident_id,
                r.action_type,
                r.description,
                r.status,
                r.executed_by,
                r.execution_result,
                r.executed_at,
                r.created_at,
                i.title AS incident_title,
                i.severity AS incident_severity,
                i.status AS incident_status
            FROM response_actions r
            LEFT JOIN incidents i
                ON r.incident_id = i.id
            ORDER BY r.id DESC
        `);

        res.status(200).json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });
    } catch (error) {
        console.error("Error fetching response actions:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch response actions"
        });
    }
};

const getResponseActionById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `
            SELECT
                r.id,
                r.incident_id,
                r.action_type,
                r.description,
                r.status,
                r.executed_by,
                r.execution_result,
                r.executed_at,
                r.created_at,
                i.title AS incident_title,
                i.severity AS incident_severity,
                i.status AS incident_status
            FROM response_actions r
            LEFT JOIN incidents i
                ON r.incident_id = i.id
            WHERE r.id = $1
            `,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Response action not found"
            });
        }

        res.status(200).json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error("Error fetching response action:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch response action"
        });
    }
};

const createResponseAction = async (req, res) => {
    try {
        const incident_id = req.body.incident_id || req.body.incidentId;
        const action_type = req.body.action_type || req.body.actionType;
        const description = req.body.description;

        if (!incident_id || !action_type || !description) {
            return res.status(400).json({
                success: false,
                message: "incident_id, action_type and description are required"
            });
        }

        const incidentResult = await pool.query(
            `
            SELECT id, status
            FROM incidents
            WHERE id = $1
            `,
            [incident_id]
        );

        if (incidentResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Incident not found"
            });
        }

        const result = await pool.query(
            `
            INSERT INTO response_actions
            (
                incident_id,
                action_type,
                description,
                status,
                executed_by
            )
            VALUES
            (
                $1,
                $2,
                $3,
                'pending',
                'SentinelX Automated Response'
            )
            RETURNING
                id,
                incident_id,
                action_type,
                description,
                status,
                executed_by,
                execution_result,
                executed_at,
                created_at
            `,
            [
                incident_id,
                action_type,
                description
            ]
        );

        // Record response action creation in incident timeline
        await pool.query(
            `
            INSERT INTO incident_timeline
                (incident_id, event_type, event_title, event_description, severity, status, reference_id, event_time)
            VALUES
                ($1, 'response', $2, $3, NULL, 'pending', $4, CURRENT_TIMESTAMP)
            `,
            [
                incident_id,
                `Response Action Created: ${action_type}`,
                description,
                result.rows[0].id
            ]
        );

        res.status(201).json({
            success: true,
            message: "Response action created",
            data: result.rows[0]
        });
    } catch (error) {
        console.error("Error creating response action:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to create response action"
        });
    }
};

const executeResponseAction = async (req, res) => {
    try {
        const { id } = req.params;

        const actionResult = await pool.query(
            `
            SELECT
                id,
                incident_id,
                action_type,
                description,
                status
            FROM response_actions
            WHERE id = $1
            `,
            [id]
        );

        if (actionResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Response action not found"
            });
        }

        const action = actionResult.rows[0];

        if (action.status === "completed") {
            return res.status(409).json({
                success: false,
                message: "Response action has already been completed"
            });
        }

        const executionResult =
            `SIMULATED: ${action.action_type} would be executed for incident ${action.incident_id}. No actual system or network change was performed.`;

        const result = await pool.query(
            `
            UPDATE response_actions
            SET
                status = 'completed',
                executed_by = 'SentinelX Automated Response',
                execution_result = $1,
                executed_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING
                id,
                incident_id,
                action_type,
                description,
                status,
                executed_by,
                execution_result,
                executed_at,
                created_at
            `,
            [executionResult, id]
        );

        // Record execution in incident timeline
        await pool.query(
            `
            INSERT INTO incident_timeline
                (incident_id, event_type, event_title, event_description, severity, status, reference_id, event_time)
            VALUES
                ($1, 'response', $2, $3, NULL, 'completed', $4, CURRENT_TIMESTAMP)
            `,
            [
                action.incident_id,
                `Response Action Executed: ${action.action_type}`,
                executionResult,
                id
            ]
        );

        res.status(200).json({
            success: true,
            message: "Response action executed successfully",
            data: result.rows[0]
        });
    } catch (error) {
        console.error("Error executing response action:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to execute response action"
        });
    }
};

module.exports = {
    getResponseActions,
    getResponseActionById,
    createResponseAction,
    executeResponseAction
};