const express = require("express");

const {
    getNormalizedLogs,
    createNormalizedLog
} = require("../controllers/normalizedLogController");

const router = express.Router();

router.get("/", getNormalizedLogs);

router.post("/", createNormalizedLog);

module.exports = router;