const express = require("express");

const {
    analyzeAlert,
    getAIAnalysis,
    handleCopilotChat,
    handleSwarmInvestigate,
    getSwarmAgents
} = require("../controllers/aiController");

const router = express.Router();

// Alert analysis endpoints
router.post("/alerts/:id/analyze", analyzeAlert);
router.get("/alerts/:id/analysis", getAIAnalysis);

// Conversational Copilot and Multi-Agent Swarm endpoints
router.post("/chat", handleCopilotChat);
router.post("/swarm-investigate", handleSwarmInvestigate);
router.get("/agents", getSwarmAgents);

module.exports = router;