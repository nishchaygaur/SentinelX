const express = require("express");
const { ingestLogs, getRawLogs } = require("../controllers/ingestionController");

const router = express.Router();

router.post("/ingest", ingestLogs);
router.get("/raw", getRawLogs);

module.exports = router;
