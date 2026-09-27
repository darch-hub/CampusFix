import { Router } from "express";
import { eq, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { issues, locations, statusEvents, notifications, user, URGENCIES, STATUSES } from "../db/schema.js";
import { requireAdmin } from "../middleware/auth.js";
import { sendStatusEmail } from "../email/resend.js";
import { isOverdue, effectiveUrgency, urgencyRank } from "../utils/overdue.js";

const router = Router();
const NEXT = { Reported: ["Acknowledged"], Acknowledged: ["In Progress"], "In Progress": ["Resolved"], Resolved: [] };

// PATCH /api/admin/issues/:id — triage: status + urgency override (PRD §5.2–5.3)
router.patch(
  "/issues/:id",
  requireAdmin(async (req, res) => {
    const id = Number(req.params.id);
    const rows = await db.select().from(issues).where(eq(issues.id, id));
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    const issue = rows[0];
    const { status, adminUrgency } = req.body;

    if (adminUrgency !== undefined) {
      if (adminUrgency !== null && !URGENCIES.includes(adminUrgency)) return res.status(422).json({ error: "Invalid urgency" });
    }
    if (status !== undefined) {
      if (!STATUSES.includes(status)) return res.status(422).json({ error: "Invalid status" });
      if (status !== issue.status && !NEXT[issue.status].includes(status)) {
        return res.status(422).json({ error: `Illegal transition ${issue.status} → ${status}` });
      }
    }

    const patch = { updatedAt: new Date() };
    if (adminUrgency !== undefined) patch.adminUrgency = adminUrgency;
    if (status !== undefined) {
      patch.status = status;
      if (status === "Resolved") patch.resolvedAt = new Date();
    }
    const updated = await db.update(issues).set(patch).where(eq(issues.id, id)).returning();
    const next = updated[0];

    if (status && status !== issue.status) {
      await db.insert(statusEvents).values({ issueId: id, fromStatus: issue.status, toStatus: status, actorId: req.auth.user.id });
      if (next.reporterId) {
        const type = status === "Acknowledged" ? "status_acknowledged" : status === "In Progress" ? "status_in_progress" : "status_resolved";
        await db.insert(notifications).values({ userId: next.reporterId, issueId: id, type });
        if (status === "Resolved") {
          await db.insert(notifications).values({ userId: next.reporterId, issueId: id, type: "confirm_requested" });
        }
        const reporter = await db.select().from(user).where(eq(user.id, next.reporterId));
        if (reporter.length) {
          await sendStatusEmail({
            to: reporter[0].email,
            subject: `CampusFix: issue #${id} is now ${status}`,
            html: `<p>Your report (#${id}) moved from ${issue.status} to <b>${status}</b>.</p>`,
          });
        }
      }
    }
    res.json(next);
  })
);

// GET /api/admin/issues — queue sorted Emergency/High first, then oldest
router.get(
  "/issues",
  requireAdmin(async (req, res) => {
    const rows = await db.select().from(issues);
    rows.sort((a, b) => urgencyRank(effectiveUrgency(a)) - urgencyRank(effectiveUrgency(b)) || new Date(a.createdAt) - new Date(b.createdAt));
    res.json(rows.map((r) => ({ ...r, effectiveUrgency: effectiveUrgency(r), overdue: isOverdue(r) })));
  })
);

// GET /api/admin/dashboard (PRD §5.7)
router.get(
  "/dashboard",
  requireAdmin(async (req, res) => {
    const open = await db.execute(sql`select count(*)::int as n from issues where status != 'Resolved'`);
    const resolved = await db.execute(sql`select count(*)::int as n from issues where status = 'Resolved'`);
    const avgOverall = await db.execute(sql`select avg(extract(epoch from (resolved_at - created_at))/3600)::float as h from issues where resolved_at is not null`);
    const byCategory = await db.execute(sql`select category, count(*)::int as n from issues group by category order by n desc`);
    const avgByCategory = await db.execute(
      sql`select category, avg(extract(epoch from (resolved_at - created_at))/3600)::float as h from issues where resolved_at is not null group by category`
    );
    const byLocation = await db.execute(
      sql`select l.name as location, count(i.id)::int as n from issues i join locations l on l.id = i.location_id group by l.name order by n desc`
    );
    const all = await db.select().from(issues);
    const overdue = all.filter((i) => i.status !== "Resolved" && isOverdue(i));
    res.json({
      open: open.rows[0].n,
      resolved: resolved.rows[0].n,
      avgResolutionHours: avgOverall.rows[0].h,
      avgByCategory: avgByCategory.rows,
      byCategory: byCategory.rows,
      byLocation: byLocation.rows,
      overdueCount: overdue.length,
      overdue: overdue.map((i) => i.id),
    });
  })
);

// Admin location management (PRD §9: list maintained by admins)
router.get("/locations", requireAdmin(async (_req, res) => res.json(await db.select().from(locations))));
router.post("/locations", requireAdmin(async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(422).json({ error: "Name required" });
  const rows = await db.insert(locations).values({ name: name.trim() }).returning();
  res.status(201).json(rows[0]);
}));
router.patch("/locations/:id", requireAdmin(async (req, res) => {
  const rows = await db.update(locations).set({ name: req.body.name?.trim(), isActive: req.body.isActive }).where(eq(locations.id, Number(req.params.id))).returning();
  if (!rows.length) return res.status(404).json({ error: "Not found" });
  res.json(rows[0]);
}));

export default router;
