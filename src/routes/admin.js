const express = require("express");

const router = express.Router();
const notImplemented = (todo) => (req, res) =>
  res.status(501).json({ error: "Not implemented (scaffold)", todo });

// PRD §5.2–5.3: PATCH /api/admin/issues/:id — acknowledge / update status /
// resolve / override urgency (Emergency/High surfaced first; notify reporter)
router.patch("/issues/:id", notImplemented("status transition + urgency override + notify reporter"));

// PRD §5.6–5.7: GET /api/admin/dashboard — open vs resolved, avg resolution
// time (overall/by category), by category/location, overdue count
router.get("/dashboard", notImplemented("aggregate dashboard metrics + overdue flagging"));

module.exports = router;
