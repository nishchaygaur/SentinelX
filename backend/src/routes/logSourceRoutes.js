const express = require("express");

const {
    getLogSources
} = require("../controllers/logSourceController");

const router = express.Router();

router.get("/", getLogSources);

module.exports = router;