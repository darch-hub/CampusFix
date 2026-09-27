import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { db } from "./db/index.js";
import * as schema from "./db/schema.js";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  user: { additionalFields: { role: { type: "string", defaultValue: "reporter", required: false } } },
  plugins: [admin({ defaultRole: "reporter", adminRoles: ["admin"] })],
  trustedOrigins: [process.env.BETTER_AUTH_URL || "http://localhost:3000"],
});
