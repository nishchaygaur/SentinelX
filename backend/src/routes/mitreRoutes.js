const express = require("express");
const {
    getMitreMatrix,
    getTechniqueDetails
} = require("../controllers/mitreController");

const router = express.Router();

router.get("/matrix", getMitreMatrix);
router.get("/techniques/:id", getTechniqueDetails);

module.exports = router;
