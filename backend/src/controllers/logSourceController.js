const pool = require("../config/db");

const getLogSources = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM log_sources ORDER BY id ASC"
        );

        res.status(200).json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });
    } catch (error) {
        console.error("Error fetching log sources:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch log sources"
        });
    }
};

module.exports = {
    getLogSources
};