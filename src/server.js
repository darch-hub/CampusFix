import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth.js";
import issuesRouter from "./routes/issues.js";
import adminRouter from "./routes/admin.js";
import apiRouter from "./routes/api.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 3000;

app.all("/api/auth/*", toNodeHandler(auth));
app.use(express.json());
// Digital Asset Links for the Android TWA (express.static ignores dotfiles).
app.get("/.well-known/assetlinks.json", (_req, res) =>
  res.sendFile(path.join(__dirname, "..", "public", ".well-known", "assetlinks.json"))
);
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "campusfix", version: "0.2.0" }));
app.use("/api", apiRouter);
app.use("/api/issues", issuesRouter);
app.use("/api/admin", adminRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal error" });
});

if (process.argv[1] === __filename) {
  app.listen(PORT, () => console.log(`CampusFix listening on http://localhost:${PORT}`));
}

export default app;
