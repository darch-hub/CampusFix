import { Router } from "express";
import multer from "multer";
import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { issues, locations, upvotes, statusEvents, notifications, user, CATEGORIES, URGENCIES } from "../db/schema.js";
import { requireAuth } from "../middleware/auth.js";
import { uploadPhoto, isR2Configured, getPhotoUrl } from "../storage/r2.js";
import { effectiveUrgency, isOverdue } from "../utils/overdue.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|webp)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error("Photo must be JPEG, PNG, or WebP"));
  },
});

function mask(row, viewer) {
  const isAdmin = viewer?.role === "admin";
  const { reporterId, ...rest } = row;
  return {
    ...rest,
    reporter: row.isAnonymous || !isAdmin ? null : row.reporterName,
    photoUrl: row.photoUrl ?? null,
    upvoteCount: Number(row.upvoteCount ?? 0),
    overdue: isOverdue({ ...row, adminUrgency: row.adminUrgency, reporterUrgency: row.reporterUrgency, updatedAt: row.updatedAt }),
    effectiveUrgency: effectiveUrgency(row),
  };
}

// GET /api/issues — logged-in public list with filters (PRD §5.4)
router.get(
  "/",
  requireAuth(async (req, res) => {
    const { category, locationId, status, mine } = req.query;
    const conds = [];
    if (category) conds.push(eq(issues.category, String(category)));
    if (locationId) conds.push(eq(issues.locationId, Number(locationId)));
    if (status) conds.push(eq(issues.status, String(status)));
    if (mine === "1") conds.push(eq(issues.reporterId, req.auth.user.id));

    const rows = await db
      .select({
        id: issues.id,
        category: issues.category,
        locationId: issues.locationId,
        locationName: locations.name,
        description: issues.description,
        photoKey: issues.photoKey,
        reporterUrgency: issues.reporterUrgency,
        adminUrgency: issues.adminUrgency,
        isAnonymous: issues.isAnonymous,
        reporterId: issues.reporterId,
        reporterName: user.name,
        status: issues.status,
        createdAt: issues.createdAt,
        updatedAt: issues.updatedAt,
        upvoteCount: sql`(select count(*)::int from ${upvotes} where ${upvotes.issueId} = ${issues.id})`.as("upvoteCount"),
      })
      .from(issues)
      .leftJoin(locations, eq(issues.locationId, locations.id))
      .leftJoin(user, eq(issues.reporterId, user.id))
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(desc(issues.updatedAt));

    const out = [];
    for (const r of rows) {
      out.push(mask({ ...r, photoUrl: r.photoKey ? await getPhotoUrlSafe(r.photoKey) : null }, req.auth.user));
    }
    res.json(out);
  })
);

async function getPhotoUrlSafe(key) {
  try {
    const { getPhotoUrl } = await import("../storage/r2.js");
    return await getPhotoUrl(key);
  } catch {
    return null;
  }
}

// POST /api/issues — submit report (PRD §5.1)
router.post(
  "/",
  requireAuth(upload.single("photo")),
  requireAuth(async (req, res) => {
    const { category, locationId, description, reporterUrgency, isAnonymous } = req.body;
    if (!CATEGORIES.includes(category)) return res.status(422).json({ error: "Invalid category" });
    if (!URGENCIES.includes(reporterUrgency ?? "Medium")) return res.status(422).json({ error: "Invalid urgency" });
    if (!description?.trim()) return res.status(422).json({ error: "Description is required" });

    const loc = await db.select().from(locations).where(eq(locations.id, Number(locationId)));
    if (!loc.length || !loc[0].isActive) return res.status(422).json({ error: "Invalid location — pick from the predefined list" });

    let photoKey = null;
    if (req.file) {
      if (!isR2Configured()) {
        console.warn("[r2] Photo skipped — R2 not configured. Set R2_* in .env.");
      } else {
        photoKey = await uploadPhoto(req.file.buffer, req.file.mimetype);
      }
    }

    const inserted = await db
      .insert(issues)
      .values({
        category,
        locationId: Number(locationId),
        description: description.trim(),
        photoKey,
        reporterUrgency: reporterUrgency ?? "Medium",
        isAnonymous: isAnonymous === true || isAnonymous === "true",
        reporterId: req.auth.user.id,
        status: "Reported",
      })
      .returning();
    const issue = inserted[0];
    await db.insert(statusEvents).values({ issueId: issue.id, fromStatus: null, toStatus: "Reported", actorId: req.auth.user.id });
    res.status(201).json(issue);
  })
);

// POST /api/issues/:id/upvote — toggle confirm (PRD §5.4)
router.post(
  "/:id/upvote",
  requireAuth(async (req, res) => {
    const id = Number(req.params.id);
    const existing = await db.select().from(upvotes).where(and(eq(upvotes.issueId, id), eq(upvotes.userId, req.auth.user.id)));
    if (existing.length) {
      await db.delete(upvotes).where(and(eq(upvotes.issueId, id), eq(upvotes.userId, req.auth.user.id)));
      return res.json({ upvoted: false });
    }
    await db.insert(upvotes).values({ issueId: id, userId: req.auth.user.id });
    res.json({ upvoted: true });
  })
);

// POST /api/issues/:id/confirm — reporter confirms fix or reopens (PRD §5.2)
router.post(
  "/:id/confirm",
  requireAuth(async (req, res) => {
    const id = Number(req.params.id);
    const rows = await db.select().from(issues).where(eq(issues.id, id));
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    const issue = rows[0];
    if (issue.status !== "Resolved") return res.status(422).json({ error: "Only resolved issues can be confirmed" });
    if (issue.reporterId !== req.auth.user.id && req.auth.user.role !== "admin") {
      return res.status(403).json({ error: "Only the reporter can confirm" });
    }
    const { fixed } = req.body;
    if (fixed === true) {
      await db.insert(notifications).values({ userId: issue.reporterId, issueId: id, type: "confirm_closed" });
      return res.json({ status: "Resolved" });
    }
    await db.update(issues).set({ status: "In Progress", updatedAt: new Date(), resolvedAt: null }).where(eq(issues.id, id));
    await db.insert(statusEvents).values({ issueId: id, fromStatus: "Resolved", toStatus: "In Progress", actorId: req.auth.user.id });
    if (issue.reporterId) await db.insert(notifications).values({ userId: issue.reporterId, issueId: id, type: "reopened" });
    res.json({ status: "In Progress" });
  })
);

export default router;
