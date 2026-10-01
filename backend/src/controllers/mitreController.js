const {
    getMitreHeatmapData,
    getTechniqueById
} = require("../services/mitreService");

/**
 * Controller to fetch the full MITRE ATT&CK Heatmap Matrix
 */
const getMitreMatrix = async (req, res) => {
    try {
        const incidentId = req.query.incidentId ? parseInt(req.query.incidentId, 10) : null;
        const matrixData = await getMitreHeatmapData(incidentId);

        res.status(200).json({
            success: true,
            data: matrixData
        });
    } catch (error) {
        console.error("Error generating MITRE heatmap matrix:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to generate MITRE ATT&CK Heatmap Matrix",
            error: error.message
        });
    }
};

/**
 * Controller to fetch deep details for a single technique
 */
const getTechniqueDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const technique = getTechniqueById(id);

        if (!technique) {
            return res.status(404).json({
                success: false,
                message: `Technique ${id} not found in MITRE catalog`
            });
        }

        res.status(200).json({
            success: true,
            data: technique
        });
    } catch (error) {
        console.error("Error fetching technique details:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch technique details",
            error: error.message
        });
    }
};

module.exports = {
    getMitreMatrix,
    getTechniqueDetails
};
