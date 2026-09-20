const express = require("express");
const path = require("path");

const issuesRouter = require("./routes/issues");
const adminRouter = require("./routes/admin");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/api/health", (req, res) => res.json({ status: "ok", service: "campusfix", version: "0.1.0" }));
app.use("/api/issues", issuesRouter);
app.use("/api/admin", adminRouter);

if (require.main === module) {
  app.listen(PORT, () => console.log(`CampusFix scaffold listening on http://localhost:${PORT}`));
}

module.exports = app;
