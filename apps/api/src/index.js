import express from "express";
import cors from "cors";
import { ZodError } from "zod";
import { config } from "./config.js";
import { query } from "./db/pool.js";
import auth from "./routes/auth.js";
import publicRoutes from "./routes/public.js";
import requests from "./routes/requests.js";
import inventory from "./routes/inventory.js";
import patients from "./routes/patients.js";
import hospitalAdmin from "./routes/hospitalAdmin.js";
import admin from "./routes/admin.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.get("/api/health", async (_req, res, next) => {
  try {
    await query("SELECT 1");
    res.json({ status: "ok" });
  } catch (error) {
    next(error);
  }
});
app.use("/api/auth", auth);
app.use("/api/public", publicRoutes);
app.use("/api/requests", requests);
app.use("/api/inventory", inventory);
app.use("/api/patients", patients);
app.use("/api/hospital-admin", hospitalAdmin);
app.use("/api/admin", admin);
app.use((_req, res) => res.status(404).json({ message: "Route not found" }));
app.use((error, _req, res, _next) => {
  console.error(error);
  if (error instanceof ZodError)
    return res.status(400).json({
      message: error.issues
        .map((issue) => `${issue.path.at(-1) || "field"}: ${issue.message}`)
        .join("\n"),
      issues: error.issues,
    });
  if (error.code === "23505") {
    if (error.constraint === "users_email_key")
      return res
        .status(409)
        .json({ message: "An account already uses this email address" });
    if (error.constraint === "idx_users_identification")
      return res.status(409).json({
        message: "An account already uses this identification number",
      });
    return res.status(409).json({ message: "This record already exists" });
  }
  if (error.code === "23514" || error.code === "23503")
    return res
      .status(400)
      .json({ message: "This change conflicts with existing data" });
  res.status(500).json({ message: "An unexpected server error occurred" });
});

app.listen(config.port, "0.0.0.0", () =>
  console.log(`Blood Bank API listening on http://localhost:${config.port}`),
);
