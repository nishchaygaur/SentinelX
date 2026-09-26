const express = require("express");

const {
    runDetection
} = require("../controllers/detectionController");

const router = express.Router();

router.post("/run", runDetection);

module.exports = router;