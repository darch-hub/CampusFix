import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { locations, notifications } from "../db/schema.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Public (logged-in) predefined location list — PRD §5.1
router.get("/locations", requireAuth(async (_req, res) => {
  res.json(await db.select().from(locations).where(eq(locations.isActive, true)));
}));

// In-app inbox — PRD §5.5
router.get("/notifications", requireAuth(async (req, res) => {
  res.json(
    await db.select().from(notifications).where(eq(notifications.userId, req.auth.user.id)).orderBy(notifications.createdAt)
  );
}));

router.post("/notifications/:id/read", requireAuth(async (req, res) => {
  const rows = await db.update(notifications).set({ readAt: new Date() }).where(eq(notifications.id, Number(req.params.id))).returning();
  if (!rows.length) return res.status(404).json({ error: "Not found" });
  res.json(rows[0]);
}));

export default router;
