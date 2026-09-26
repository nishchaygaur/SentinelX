const express = require("express");

const {
    getResponseActions,
    getResponseActionById,
    createResponseAction,
    executeResponseAction
} = require("../controllers/responseActionController");

const router = express.Router();

router.get("/", getResponseActions);

router.post("/", createResponseAction);

router.post("/:id/execute", executeResponseAction);

router.get("/:id", getResponseActionById);

module.exports = router;