const express = require("express");

const {
    getAlerts,
    updateAlertStatus
} = require("../controllers/alertController");

const {
    getAlertEnrichment
} = require("../controllers/enrichmentController");

const router = express.Router();

router.get("/", getAlerts);

router.get("/:id/enrichment", getAlertEnrichment);

router.patch("/:id/status", updateAlertStatus);

module.exports = router;