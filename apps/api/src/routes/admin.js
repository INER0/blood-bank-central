import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { pool, query } from "../db/pool.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validMaldivesLocation } from "../data/maldivesLocations.js";

const router = Router();
router.use(authenticate, authorize("admin"));

router.get("/overview", async (_req, res, next) => {
  try {
    const result = await query(`SELECT
      (SELECT count(*)::int FROM hospitals) AS hospitals,
      (SELECT count(*)::int FROM hospitals WHERE approved) AS "approvedHospitals",
      (SELECT count(*)::int FROM users WHERE role='public' AND active) AS "publicUsers",
      (SELECT count(*)::int FROM users WHERE role IN ('hospital_staff','hospital_manager') AND active) AS "hospitalUsers",
      (SELECT count(*)::int FROM blood_bags WHERE status='available') AS "availableUnits",
      (SELECT count(*)::int FROM blood_requests WHERE status IN ('pending','accepted')) AS "activeRequests"`);
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.get("/hospitals", async (_req, res, next) => {
  try {
    const result =
      await query(`SELECT h.id,h.name,h.address,h.atoll,h.island,h.phone,h.approved,h.created_at AS "createdAt",
      count(DISTINCT u.id)::int AS "accountCount",count(DISTINCT b.id)::int AS "bagCount"
      FROM hospitals h LEFT JOIN users u ON u.hospital_id=h.id LEFT JOIN blood_bags b ON b.hospital_id=h.id
      GROUP BY h.id ORDER BY h.name`);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.post("/hospitals", async (req, res, next) => {
  const client = await pool.connect();
  try {
    const input = z
      .object({
        name: z.string().trim().min(2).max(150),
        address: z.string().trim().min(3).max(250),
        atoll: z.string().trim().min(2).max(80),
        island: z.string().trim().min(2).max(80),
        phone: z.string().trim().min(7).max(30),
        managerName: z.string().trim().min(2).max(100),
        managerEmail: z.email(),
        managerPassword: z.string().min(8),
      })
      .refine((value) => validMaldivesLocation(value.atoll, value.island), {
        message: "Select a valid island for the chosen atoll",
        path: ["island"],
      })
      .parse(req.body);
    await client.query("BEGIN");
    const hospital = await client.query(
      `INSERT INTO hospitals (name,address,city,atoll,island,phone,approved)
       VALUES ($1,$2,$4,$3,$4,$5,true) RETURNING id,name`,
      [input.name, input.address, input.atoll, input.island, input.phone],
    );
    const hash = await bcrypt.hash(input.managerPassword, 10);
    await client.query(
      `INSERT INTO users (email,password_hash,full_name,phone,role,hospital_id)
       VALUES (lower($1),$2,$3,$4,'hospital_manager',$5)`,
      [
        input.managerEmail,
        hash,
        input.managerName,
        input.phone,
        hospital.rows[0].id,
      ],
    );
    await client.query("COMMIT");
    res.status(201).json(hospital.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
});

router.patch("/hospitals/:id", async (req, res, next) => {
  try {
    const approved = z.boolean().parse(req.body.approved);
    const result = await query(
      "UPDATE hospitals SET approved=$1 WHERE id=$2 RETURNING id,approved",
      [approved, req.params.id],
    );
    if (!result.rowCount)
      return res.status(404).json({ message: "Hospital not found" });
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.get("/users", async (req, res, next) => {
  try {
    const search = String(req.query.search || "").trim();
    const result = await query(
      `SELECT u.id,u.full_name AS "fullName",u.email,u.role,u.active,u.identification_number AS "identificationNumber",h.name AS hospital
       FROM users u LEFT JOIN hospitals h ON h.id=u.hospital_id
       WHERE ($1='' OR u.full_name ILIKE '%'||$1||'%' OR u.email ILIKE '%'||$1||'%' OR u.identification_number ILIKE '%'||$1||'%' OR h.name ILIKE '%'||$1||'%')
       ORDER BY u.created_at DESC LIMIT 100`,
      [search],
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.patch("/users/:id", async (req, res, next) => {
  try {
    const active = z.boolean().parse(req.body.active);
    if (req.params.id === req.user.id)
      return res
        .status(400)
        .json({ message: "You cannot deactivate your own account" });
    const result = await query(
      "UPDATE users SET active=$1 WHERE id=$2 RETURNING id,active",
      [active, req.params.id],
    );
    if (!result.rowCount)
      return res.status(404).json({ message: "User not found" });
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
