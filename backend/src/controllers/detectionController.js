/**
 * SentinelX Detection Controller
 * Orchestrates security detection across normalized logs.
 */

const { executeDetectionEngine } = require("../detection/detectionRules");

const runDetection = async (req, res) => {
    try {
        const results = await executeDetectionEngine();

        res.status(200).json({
            success: true,
            count: results.processed_alerts.length,
            detection_count: results.detection_count,
            data: results.processed_alerts
        });
    } catch (error) {
        console.error("Detection engine error:", error.message);

        res.status(500).json({
            success: false,
            message: "Detection engine failed",
            error: error.message
        });
    }
};

module.exports = {
    runDetection
};
