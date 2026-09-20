const express = require("express");

const router = express.Router();
const notImplemented = (todo) => (req, res) =>
  res.status(501).json({ error: "Not implemented (scaffold)", todo });

// PRD §5.1: POST /api/issues — submit report
// (category, location from predefined list, description, photo, urgency, anonymity)
router.post("/", notImplemented("validate + persist issue, handle photo upload"));

// PRD §5.4: GET /api/issues — public list with category/location/status filters
router.get("/", notImplemented("list open issues with filters"));

// PRD §5.4: POST /api/issues/:id/upvote — confirm instead of duplicate
router.post("/:id/upvote", notImplemented("increment upvote, dedupe per user"));

// PRD §5.2: POST /api/issues/:id/confirm — reporter confirms fix or reopens
router.post("/:id/confirm", notImplemented("if confirmed stay closed, else reopen to In Progress"));

module.exports = router;
