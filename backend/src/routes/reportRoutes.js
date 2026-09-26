const express = require("express");

const {
    getIncidentReport,
    downloadIncidentReportPdf
} = require("../controllers/reportController");

const router = express.Router();

router.get("/incidents/:id/report", getIncidentReport);
router.get("/incidents/:id/report/pdf", downloadIncidentReportPdf);

module.exports = router;