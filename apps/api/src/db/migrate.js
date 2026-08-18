import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { pool } from "./pool.js";

const sql = await fs.readFile(fileURLToPath(new URL("./schema.sql", import.meta.url)), "utf8");
await pool.query(sql);
console.log("Database schema is up to date.");
await pool.end();
