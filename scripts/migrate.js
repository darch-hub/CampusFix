import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
await pool.query(sql);
console.log("Migrate done.");
await pool.end();
