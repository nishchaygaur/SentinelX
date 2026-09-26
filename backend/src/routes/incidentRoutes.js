const express = require("express");

const {
    getIncidents,
    getIncidentById,
    updateIncidentStatus,
    updateIncidentDetails,
    addIncidentTimelineEvent,
    getIncidentTimeline,
    generateRandomIncident
} = require("../controllers/incidentController");

const router = express.Router();

router.get("/", getIncidents);

// IMPORTANT: Register /generate-random BEFORE /:id to prevent Express treating "generate-random" as an incident ID
router.post("/generate-random", generateRandomIncident);

router.get("/:id/timeline", getIncidentTimeline);
router.post("/:id/timeline", addIncidentTimelineEvent);

router.get("/:id", getIncidentById);

router.patch("/:id/status", updateIncidentStatus);

router.patch("/:id/details", updateIncidentDetails);

module.exports = router;