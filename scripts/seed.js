import dotenv from "dotenv";
dotenv.config();

import { db, pool } from "../src/db/index.js";
import { locations, issues, statusEvents } from "../src/db/schema.js";
import { auth } from "../src/auth.js";

const LOCATIONS = [
  "Main Hostel - Block A",
  "Main Hostel - Block B",
  "Library - Ground Floor",
  "Library - First Floor",
  "Science Building - Lab 101",
  "Admin Block - Reception",
];

async function ensureUser(name, email, password, role) {
  try {
    await auth.api.signUpEmail({ body: { name, email, password } });
  } catch (e) {
    if (!String(e?.message).toLowerCase().includes("already")) throw e;
  }
  const { user } = await import("../src/db/schema.js");
  const { eq } = await import("drizzle-orm");
  const rows = await db.update(user).set({ role }).where(eq(user.email, email)).returning();
  return rows[0];
}

async function main() {
  for (const name of LOCATIONS) {
    await db.insert(locations).values({ name }).onConflictDoNothing({ target: locations.name });
  }
  const admin = await ensureUser("Campus Admin", "admin@campusfix.local", "Admin1234!", "admin");
  const ada = await ensureUser("Ada Reporter", "ada@campusfix.local", "Reporter123!", "reporter");
  const bola = await ensureUser("Bola Reporter", "bola@campusfix.local", "Reporter123!", "reporter");

  const locs = await db.select().from(locations);
  const byName = Object.fromEntries(locs.map((l) => [l.name, l.id]));
  const samples = [
    { category: "Electrical", location: "Main Hostel - Block A", description: "Corridor lights flickering on 2nd floor", reporterUrgency: "High", status: "Reported", reporter: ada },
    { category: "Plumbing", location: "Main Hostel - Block B", description: "Leaking pipe in bathroom", reporterUrgency: "Emergency", status: "Acknowledged", reporter: bola },
    { category: "Structural", location: "Library - Ground Floor", description: "Cracked wall tile near entrance", reporterUrgency: "Medium", status: "In Progress", reporter: ada },
    { category: "Furniture", location: "Science Building - Lab 101", description: "Broken lab stool", reporterUrgency: "Low", status: "Resolved", reporter: bola },
  ];
  for (const s of samples) {
    const backdated = s.status === "Resolved";
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 3600 * 1000);
    const rows = await db.insert(issues).values({
      category: s.category,
      locationId: byName[s.location],
      description: s.description,
      reporterUrgency: s.reporterUrgency,
      reporterId: s.reporter.id,
      status: s.status,
      createdAt: backdated ? twoDaysAgo : new Date(),
      updatedAt: backdated ? twoDaysAgo : new Date(),
      resolvedAt: s.status === "Resolved" ? new Date() : null,
    }).returning();
    await db.insert(statusEvents).values({ issueId: rows[0].id, fromStatus: null, toStatus: s.status, actorId: admin.id });
  }
  console.log("Seed done: admin@campusfix.local / Admin1234!, ada@campusfix.local / Reporter123!");
  await pool.end();
}

main().catch(async (e) => { console.error(e); await pool.end(); process.exit(1); });
