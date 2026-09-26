const pool = require("../config/db");
const {
    analyzeAlertWithAI
} = require("../services/aiService");

const analyzeAlert = async (req, res) => {
    try {
        const { id } = req.params;

        // Get alert
        const alertResult = await pool.query(
            `
            SELECT
                id,
                log_id,
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

        const alert = alertResult.rows[0];

        // Get normalized log
        const logResult = await pool.query(
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
                l.name AS log_source
            FROM normalized_logs n
            LEFT JOIN log_sources l
                ON n.source_id = l.id
            WHERE n.id = $1
            `,
            [alert.log_id]
        );

        const log = logResult.rows[0] || null;

        // Get MITRE ATT&CK
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

        // Get threat intelligence
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

        const alertData = {
            alert,
            log,
            mitre_attack: mitreResult.rows,
            threat_intelligence: threatIntelResult.rows
        };

        // Send to AI
        const aiResult = await analyzeAlertWithAI(alertData);

        // Check for existing AI analysis
        const existingAnalysis = await pool.query(
            `
            SELECT id
            FROM ai_analysis
            WHERE alert_id = $1
            ORDER BY id DESC
            LIMIT 1
            `,
            [id]
        );

        let analysisResult;

        if (existingAnalysis.rows.length > 0) {
            // Update existing analysis instead of creating duplicate
            analysisResult = await pool.query(
                `
                UPDATE ai_analysis
                SET
                    summary = $1,
                    threat_assessment = $2,
                    risk_explanation = $3,
                    investigation_steps = $4,
                    recommended_response = $5,
                    model_name = $6,
                    provider = $7,
                    raw_response = $8
                WHERE id = $9
                RETURNING *
                `,
                [
                    aiResult.summary || null,
                    aiResult.threat_assessment || null,
                    aiResult.risk_explanation || null,
                    JSON.stringify(aiResult.investigation_steps || []),
                    JSON.stringify(aiResult.recommended_response || []),
                    aiResult.model_name || null,
                    aiResult.provider || null,
                    aiResult.raw_response || null,
                    existingAnalysis.rows[0].id
                ]
            );
        } else {
            // Create first analysis for this alert
            analysisResult = await pool.query(
                `
                INSERT INTO ai_analysis
                (
                    alert_id,
                    summary,
                    threat_assessment,
                    risk_explanation,
                    investigation_steps,
                    recommended_response,
                    model_name,
                    provider,
                    raw_response
                )
                VALUES
                (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    $7,
                    $8,
                    $9
                )
                RETURNING *
                `,
                [
                    id,
                    aiResult.summary || null,
                    aiResult.threat_assessment || null,
                    aiResult.risk_explanation || null,
                    JSON.stringify(aiResult.investigation_steps || []),
                    JSON.stringify(aiResult.recommended_response || []),
                    aiResult.model_name || null,
                    aiResult.provider || null,
                    aiResult.raw_response || null
                ]
            );
        }

        const analysis = analysisResult.rows[0];

        res.status(200).json({
            success: true,
            message: "AI analysis completed",
            data: {
                ...analysis,
                investigation_steps:
                    aiResult.investigation_steps || [],
                recommended_response:
                    aiResult.recommended_response || []
            }
        });

    } catch (error) {
        console.error(
            "AI analysis controller error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "AI analysis failed",
            error: error.message
        });
    }
};

const getAIAnalysis = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `
            SELECT
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
            WHERE alert_id = $1
            ORDER BY id DESC
            LIMIT 1
            `,
            [id]
        );

        const analyses = result.rows.map((analysis) => {
            let investigationSteps = [];
            let recommendedResponse = [];

            try {
                investigationSteps =
                    typeof analysis.investigation_steps === "string"
                        ? JSON.parse(analysis.investigation_steps)
                        : analysis.investigation_steps || [];
            } catch {
                investigationSteps = [];
            }

            try {
                recommendedResponse =
                    typeof analysis.recommended_response === "string"
                        ? JSON.parse(analysis.recommended_response)
                        : analysis.recommended_response || [];
            } catch {
                recommendedResponse = [];
            }

            return {
                ...analysis,
                investigation_steps: investigationSteps,
                recommended_response: recommendedResponse
            };
        });

        res.status(200).json({
            success: true,
            count: analyses.length,
            data: analyses
        });

    } catch (error) {
        console.error(
            "Error fetching AI analysis:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Failed to fetch AI analysis"
        });
    }
};

module.exports = {
    analyzeAlert,
    getAIAnalysis
};