const express = require("express");

const {
    analyzeAlert,
    getAIAnalysis
} = require("../controllers/aiController");

const router = express.Router();

router.post("/alerts/:id/analyze", analyzeAlert);

router.get("/alerts/:id/analysis", getAIAnalysis);

module.exports = router;